'use client';

import { useState } from 'react';
import { dreaction } from 'dreaction-react';
import {
  useDebugCounter,
  useDebugList,
  useDebugObject,
} from '../utils/dreaction';

export default function Home() {
  const [counter, setCounter] = useState(0);
  const [arr, setArr] = useState<number[]>([]);

  // Register data watchers
  useDebugCounter(counter);
  useDebugList(arr);
  useDebugObject({ foo: 'bar', timestamp: Date.now() });

  const handleRandomArray = () => {
    const randomArray = Array.from(
      { length: Math.round(Math.random() * 100) },
      () => Math.floor(Math.random() * 100)
    );
    setArr(randomArray);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 py-16 px-8 bg-white dark:bg-zinc-950">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50 mb-4">
            ⚛️ DReaction Next.js Demo
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Open the DReaction panel in the top right corner, connect to the
            debug server, and try the features below
          </p>
        </div>

        {/* Console Logs Section */}
        <div className="w-full max-w-2xl">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
            Console Logging Tests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
              onClick={() => console.log('Foooooo')}
            >
              Log String
            </button>
            <button
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
              onClick={() => console.log(Math.random())}
            >
              Log Number
            </button>
            <button
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
              onClick={() => console.log({ foo: 'bar' })}
            >
              Log Object
            </button>
            <button
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
              onClick={() => console.log('1', 2, {}, [])}
            >
              Log Mixed Types
            </button>
          </div>
        </div>

        {/* Network Request Section */}
        <div className="w-full max-w-2xl">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
            Network Request Test
          </h2>
          <button
            className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
            onClick={() => {
              fetch('https://api.github.com/repos/moonrailgun/dreaction')
                .then((response) => response.json())
                .then((data) => console.log('API Response:', data))
                .catch((error) => console.error('API Error:', error));
            }}
          >
            Send Network Request
          </button>
        </div>

        {/* Counter Section */}
        <div className="w-full max-w-2xl">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
            Counter (Data Monitoring)
          </h2>
          <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <div className="text-3xl font-bold text-center mb-4 text-black dark:text-zinc-50">
              Counter: {counter}
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
                onClick={() => setCounter(counter + 1)}
              >
                Increment
              </button>
              <button
                className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
                onClick={() => setCounter(counter - 1)}
              >
                Decrement
              </button>
              <button
                className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
                onClick={() => setCounter(0)}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Array Section */}
        <div className="w-full max-w-2xl">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
            Array Data (Data Monitoring)
          </h2>
          <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <div className="mb-4 text-zinc-700 dark:text-zinc-300">
              Array Length: {arr.length}
            </div>
            <button
              className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
              onClick={handleRandomArray}
            >
              Generate Random Array
            </button>
          </div>
        </div>

        {/* Issue Report Section */}
        <div className="w-full max-w-2xl">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
            Issue Report Test
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
              onClick={() =>
                dreaction.reportIssue(
                  'test-issue-1',
                  'Test Issue',
                  'This is a test issue reported from Next.js demo'
                )
              }
            >
              Report Issue (Same ID)
            </button>
            <button
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
              onClick={() =>
                dreaction.reportIssue(
                  `issue-${Date.now()}`,
                  'Random Issue',
                  'This issue has a unique ID'
                )
              }
            >
              Report Issue (Unique ID)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-8">
          <p>
            Check out{' '}
            <a
              href="https://github.com/moonrailgun/dreaction"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              DReaction GitHub
            </a>{' '}
            for more information
          </p>
        </div>
      </main>
    </div>
  );
}
