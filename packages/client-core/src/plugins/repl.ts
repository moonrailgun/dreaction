import type { DReactionCore, Plugin } from '../types';

// eslint-disable-next-line @typescript-eslint/ban-types
export type AcceptableRepls = object | Function | string | number;

const repl = () => (dreaction: DReactionCore) => {
  const myRepls: { [key: string]: AcceptableRepls } = {};
  // let currentContext = null
  return {
    onCommand: ({ type, payload }) => {
      if (type.substr(0, 5) !== 'repl.') return;

      switch (type.substr(5)) {
        case 'ls':
          dreaction.send('repl.ls.response', Object.keys(myRepls));
          break;
        // case "cd":
        //   const changeTo = myRepls.find(r => r.name === payload)
        //   if (!changeTo) {
        //     dreaction.send("repl.cd.response", "That REPL does not exist")
        //     break
        //   }
        //   currentContext = payload
        //   dreaction.send("repl.cd.response", `Change REPL to "${payload}"`)
        //   break
        case 'execute':
          // if (!currentContext) {
          //   dreaction.send(
          //     "repl.execute.response",
          //     "You must first select the REPL to use. Try 'ls'"
          //   )
          //   break
          // }
          // const currentRepl = myRepls.find(r => r.name === currentContext)
          // if (!currentRepl) {
          //   dreaction.send("repl.execute.response", "The selected REPL no longer exists.")
          //   break
          // }
          dreaction.send(
            'repl.execute.response',
            function () {
              return eval(payload); // eslint-disable-line no-eval
            }.call(myRepls)
          );
          break;
      }
    },
    features: {
      repl: (name: string, value: AcceptableRepls) => {
        if (!name) {
          throw new Error('You must provide a name for your REPL');
        }

        if (myRepls[name]) {
          throw new Error('You are already REPLing an item with that name');
        }

        myRepls[name] = value;
      },
    },
  } satisfies Plugin<DReactionCore>;
};
export default repl;
