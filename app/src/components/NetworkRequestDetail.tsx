import React from 'react';
import { Badge, Tabs } from '@mantine/core';
import type { NetworkRequest, NetworkResponse } from 'dreaction-protocol';
import { JSONView } from './JSONView';
import { CopyText } from './CopyText';
import { apiRequestToCurl } from '../utils/api';
import { tryToParseJSON, getPayloadSize, formatBytes } from '../utils/utils';

export interface NetworkRequestDetailProps {
  request: NetworkRequest;
  response?: NetworkResponse;
  duration?: number;
}

export const NetworkRequestDetail: React.FC<NetworkRequestDetailProps> =
  React.memo(({ request, response, duration }) => {
    const canCopyAsCurl = request && response;

    return (
      <Tabs defaultValue="summary">
        <Tabs.List className="items-center">
          <Tabs.Tab value="summary">Summary</Tabs.Tab>
          <Tabs.Tab value="request">Request</Tabs.Tab>
          <Tabs.Tab value="response">Response</Tabs.Tab>

          <div className="w-4" />
          {canCopyAsCurl && (
            <CopyText
              label="Copy as curl"
              value={apiRequestToCurl({
                request,
                response,
                duration: duration ?? 0,
              })}
            />
          )}
        </Tabs.List>

        <Tabs.Panel value="summary">
          <div>
            <span className="opacity-60 text-xs mr-2 dark:text-gray-500">
              Url:
            </span>
            <span className="text-sm dark:text-gray-300">{request.url}</span>
          </div>
          {response && (
            <div>
              <span className="opacity-60 text-xs mr-2 dark:text-gray-500">
                Status Code:
              </span>
              <Badge>{response.status}</Badge>
            </div>
          )}
          <div>
            <span className="opacity-60 text-xs mr-2 dark:text-gray-500">
              Method:
            </span>
            <Badge>{request.method}</Badge>
          </div>
          {duration !== undefined && (
            <div>
              <span className="opacity-60 text-xs mr-2 dark:text-gray-500">
                Duration:
              </span>
              <span className="dark:text-gray-300">{Math.round(duration)}</span>
              <span className="text-gray-500 dark:text-gray-600 ml-1">ms</span>
            </div>
          )}
          {response && (
            <div>
              <span className="opacity-60 text-xs mr-2 dark:text-gray-500">
                Response Size:
              </span>
              <span className="dark:text-gray-300">
                {formatBytes(getPayloadSize(response.body))}
              </span>
            </div>
          )}
          <div className="flex gap-1 items-center">
            <span className="opacity-60 text-xs dark:text-gray-500">
              Request Header
            </span>
            <CopyText value={JSON.stringify(request.headers || {}, null, 2)} />
          </div>
          <JSONView data={request.headers} hideRoot={true} />
          {response && (
            <>
              <div className="flex gap-1 items-center">
                <span className="opacity-60 text-xs dark:text-gray-500">
                  Response Header
                </span>
                <CopyText
                  value={JSON.stringify(response.headers || {}, null, 2)}
                />
              </div>
              <JSONView data={response.headers} hideRoot={true} />
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="request">
          <JSONView data={tryToParseJSON(request.data)} />
        </Tabs.Panel>

        <Tabs.Panel value="response">
          {response ? (
            <JSONView
              data={{
                ...response,
                body: tryToParseJSON(response.body),
              }}
              hideRoot={true}
            />
          ) : (
            <div className="text-center opacity-60 dark:text-gray-600 py-4">
              Response pending...
            </div>
          )}
        </Tabs.Panel>
      </Tabs>
    );
  });
NetworkRequestDetail.displayName = 'NetworkRequestDetail';
