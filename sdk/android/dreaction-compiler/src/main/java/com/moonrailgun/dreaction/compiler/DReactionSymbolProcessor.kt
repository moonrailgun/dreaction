package com.moonrailgun.dreaction.compiler

import com.google.devtools.ksp.processing.*
import com.google.devtools.ksp.symbol.*
import com.google.devtools.ksp.validate
import com.squareup.kotlinpoet.*
import com.squareup.kotlinpoet.ksp.toClassName
import com.squareup.kotlinpoet.ksp.writeTo

class DReactionSymbolProcessor(
    private val codeGenerator: CodeGenerator,
    private val logger: KSPLogger
) : SymbolProcessor {

    private val commandFunctions = mutableListOf<CommandFunction>()

    override fun process(resolver: Resolver): List<KSAnnotated> {
        val customCommandAnnotation = "com.moonrailgun.dreaction.annotations.CustomCommand"
        val paramAnnotation = "com.moonrailgun.dreaction.annotations.Param"

        val symbols = resolver.getSymbolsWithAnnotation(customCommandAnnotation)
        val unprocessed = symbols.filterNot { it.validate() }.toList()

        symbols.filter { it.validate() }.forEach { symbol ->
            if (symbol is KSFunctionDeclaration) {
                processCommandFunction(symbol, paramAnnotation)
            }
        }

        return unprocessed
    }

    private fun processCommandFunction(function: KSFunctionDeclaration, paramAnnotation: String) {
        val containingClass = function.parentDeclaration as? KSClassDeclaration
        if (containingClass == null) {
            logger.error("@CustomCommand must be used on functions inside a class", function)
            return
        }

        val annotation = function.annotations.first {
            it.shortName.asString() == "CustomCommand"
        }

        val command = annotation.arguments.find { it.name?.asString() == "command" }?.value as? String
        if (command.isNullOrEmpty()) {
            logger.error("@CustomCommand must have a non-empty command name", function)
            return
        }

        val title = annotation.arguments.find { it.name?.asString() == "title" }?.value as? String ?: ""
        val description = annotation.arguments.find { it.name?.asString() == "description" }?.value as? String ?: ""
        val responseViewType = annotation.arguments.find { it.name?.asString() == "responseViewType" }?.value as? String ?: ""

        val params = function.parameters.map { param ->
            val paramAnnotationInstance = param.annotations.firstOrNull {
                it.shortName.asString() == "Param"
            }

            val paramName = if (paramAnnotationInstance != null) {
                paramAnnotationInstance.arguments.find { it.name?.asString() == "value" }?.value as? String
                    ?: param.name?.asString() ?: ""
            } else {
                param.name?.asString() ?: ""
            }

            val paramType = if (paramAnnotationInstance != null) {
                paramAnnotationInstance.arguments.find { it.name?.asString() == "type" }?.value as? String ?: "string"
            } else {
                inferParamType(param.type.resolve())
            }

            CommandParam(paramName, paramType, param.name?.asString() ?: "")
        }

        val isSuspend = function.modifiers.contains(Modifier.SUSPEND)

        commandFunctions.add(
            CommandFunction(
                className = containingClass.toClassName(),
                functionName = function.simpleName.asString(),
                command = command,
                title = title,
                description = description,
                responseViewType = responseViewType,
                params = params,
                isSuspend = isSuspend
            )
        )
    }

    private fun inferParamType(type: KSType): String {
        return when (type.declaration.qualifiedName?.asString()) {
            "kotlin.String" -> "string"
            "kotlin.Int" -> "number"
            "kotlin.Long" -> "number"
            "kotlin.Float" -> "number"
            "kotlin.Double" -> "number"
            "kotlin.Boolean" -> "boolean"
            else -> "string"
        }
    }

    override fun finish() {
        if (commandFunctions.isEmpty()) {
            return
        }

        generateRegistry()
    }

    private fun generateRegistry() {
        val fileSpec = FileSpec.builder("com.moonrailgun.dreaction", "DReactionCommandRegistry")
            .addImport("com.moonrailgun.dreaction.plugins", "CustomCommandPlugin")
            .addImport("com.moonrailgun.dreaction.models", "CustomCommandArg")
            .addImport("android.content", "Context")

        // Group functions by class
        val functionsByClass = commandFunctions.groupBy { it.className }

        val registerAllFunction = FunSpec.builder("registerAll")
            .addParameter("plugin", ClassName("com.moonrailgun.dreaction.plugins", "CustomCommandPlugin"))
            .addParameter("context", ClassName("android.content", "Context"))

        functionsByClass.forEach { (className, functions) ->
            // Create instance of the class
            val instanceName = className.simpleName.replaceFirstChar { it.lowercase() }
            registerAllFunction.addStatement("val %L = %T()", instanceName, className)

            functions.forEach { func ->
                val argsListCode = if (func.params.isNotEmpty()) {
                    val argsBuilder = CodeBlock.builder()
                    argsBuilder.add("listOf(\n")
                    argsBuilder.indent()
                    func.params.forEachIndexed { index, param ->
                        argsBuilder.add(
                            "%T(%S, %S)",
                            ClassName("com.moonrailgun.dreaction.models", "CustomCommandArg"),
                            param.name,
                            param.type
                        )
                        if (index < func.params.size - 1) {
                            argsBuilder.add(",\n")
                        }
                    }
                    argsBuilder.unindent()
                    argsBuilder.add("\n)")
                    argsBuilder.build()
                } else {
                    CodeBlock.of("null")
                }

                val handlerCode = if (func.params.isEmpty()) {
                    if (func.isSuspend) {
                        CodeBlock.of("{\n    %L.%L()\n}", instanceName, func.functionName)
                    } else {
                        CodeBlock.of("{\n    %L.%L()\n}", instanceName, func.functionName)
                    }
                } else {
                    val paramMapping = func.params.joinToString(", ") { param ->
                        when (param.type) {
                            "number" -> "args[\"${param.name}\"]?.toIntOrNull() ?: 0"
                            "boolean" -> "args[\"${param.name}\"]?.toBoolean() ?: false"
                            else -> "args[\"${param.name}\"] ?: \"\""
                        }
                    }
                    CodeBlock.of("{ args ->\n    %L.%L(%L)\n}", instanceName, func.functionName, paramMapping)
                }

                registerAllFunction.addCode(
                    """
                    |plugin.registerCommand(
                    |    command = %S,
                    |    title = %L,
                    |    description = %L,
                    |    args = %L,
                    |    responseViewType = %L,
                    |    handler = %L
                    |)
                    |
                    """.trimMargin(),
                    func.command,
                    if (func.title.isEmpty()) "null" else "\"${func.title}\"",
                    if (func.description.isEmpty()) "null" else "\"${func.description}\"",
                    argsListCode,
                    if (func.responseViewType.isEmpty()) "null" else "\"${func.responseViewType}\"",
                    handlerCode
                )
            }
        }

        val registryObject = TypeSpec.objectBuilder("DReactionCommandRegistry")
            .addFunction(registerAllFunction.build())
            .build()

        fileSpec.addType(registryObject)

        fileSpec.build().writeTo(codeGenerator, Dependencies(false))
    }

    data class CommandFunction(
        val className: ClassName,
        val functionName: String,
        val command: String,
        val title: String,
        val description: String,
        val responseViewType: String,
        val params: List<CommandParam>,
        val isSuspend: Boolean
    )

    data class CommandParam(
        val name: String,
        val type: String,
        val actualParamName: String
    )
}
