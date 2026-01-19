import {
  type DReactionCore,
  type Plugin,
  generateRequestId,
} from 'dreaction-client-core';

/**
 * Don't include the response bodies for images by default.
 */
const DEFAULT_CONTENT_TYPES_RX = /^(image)\/.*$/i;

export interface NetworkingOptions {
  ignoreContentTypes?: RegExp;
  ignoreUrls?: RegExp;
}

const DEFAULTS: NetworkingOptions = {
  ignoreUrls: /symbolicate/,
};

const networking =
  (pluginConfig: NetworkingOptions = {}) =>
  (dreaction: DReactionCore) => {
    const options = Object.assign({}, DEFAULTS, pluginConfig);

    // a RegExp to suppress adding the body cuz it costs a lot to serialize
    const ignoreContentTypes =
      options.ignoreContentTypes || DEFAULT_CONTENT_TYPES_RX;

    // a temporary cache to hold requests so we can match up the data
    const requestCache: Record<string, any> = {};

    // Store original functions
    let originalXHROpen: typeof XMLHttpRequest.prototype.open;
    let originalXHRSend: typeof XMLHttpRequest.prototype.send;
    let originalFetch: typeof window.fetch;

    /**
     * Intercept XMLHttpRequest
     */
    const interceptXHR = () => {
      originalXHROpen = XMLHttpRequest.prototype.open;
      originalXHRSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (
        method: string,
        url: string | URL,
        ...rest: any[]
      ) {
        (this as any)._method = method;
        (this as any)._url = url.toString();
        return originalXHROpen.apply(this, [method, url, ...rest] as any);
      };

      XMLHttpRequest.prototype.send = function (data?: any) {
        const xhr = this as any;

        if (options.ignoreUrls && options.ignoreUrls.test(xhr._url)) {
          xhr._skipDReaction = true;
          return originalXHRSend.apply(this, [data]);
        }

        // Generate unique request ID
        const requestId = generateRequestId();

        // tag
        xhr._trackingName = requestId;

        // Parse request headers
        let requestHeaders: Record<string, string> = {};
        try {
          if (xhr._requestHeaders) {
            requestHeaders = xhr._requestHeaders;
          }
        } catch (e) {
          // ignore
        }

        // Parse URL and params
        const url = xhr._url;
        let params = null;
        const queryParamIdx = url ? url.indexOf('?') : -1;
        if (queryParamIdx > -1) {
          params = {} as Record<string, string>;
          url
            .substr(queryParamIdx + 1)
            .split('&')
            .forEach((pair: string) => {
              const [key, value] = pair.split('=');
              if (key && value !== undefined) {
                params![key] = decodeURIComponent(value.replace(/\+/g, ' '));
              }
            });
        }

        const tronRequest = {
          url: url || '',
          method: xhr._method || 'GET',
          data,
          headers: requestHeaders,
          params,
        };

        // cache
        requestCache[requestId] = {
          data,
          xhr,
          request: tronRequest,
          stopTimer: dreaction.startTimer(),
        };

        // Send api.request event
        (dreaction as any).apiRequest(requestId, tronRequest);

        // Setup listener for response
        const originalOnReadyStateChange = xhr.onreadystatechange;
        xhr.onreadystatechange = function () {
          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.apply(this, arguments as any);
          }

          if (xhr.readyState === 4) {
            handleXHRResponse(xhr);
          }
        };

        return originalXHRSend.apply(this, [data]);
      };
    };

    /**
     * Handle XHR response
     */
    const handleXHRResponse = (xhr: any) => {
      if (xhr._skipDReaction) {
        return;
      }

      // fetch and clear the request data from the cache
      const requestId = xhr._trackingName;
      const cachedRequest = requestCache[requestId];
      if (!cachedRequest) {
        return;
      }
      delete requestCache[requestId];

      const { request: tronRequest, stopTimer } = cachedRequest;

      // Parse response headers
      let responseHeaders: Record<string, string> = {};
      try {
        const headersString = xhr.getAllResponseHeaders();
        if (headersString) {
          headersString.split('\r\n').forEach((line: string) => {
            const parts = line.split(': ');
            if (parts.length === 2) {
              responseHeaders[parts[0]] = parts[1];
            }
          });
        }
      } catch (e) {
        // ignore
      }

      // what type of content is this?
      const contentType =
        responseHeaders['content-type'] ||
        responseHeaders['Content-Type'] ||
        '';

      let body = `~~~ skipped ~~~`;
      const response = xhr.response || xhr.responseText;

      // can we use the real response?
      const useRealResponse =
        (typeof response === 'string' || typeof response === 'object') &&
        !ignoreContentTypes.test(contentType || '');

      if (useRealResponse && response) {
        try {
          // Try to parse JSON
          if (typeof response === 'string') {
            body = JSON.parse(response);
          } else {
            body = response;
          }
        } catch (e) {
          body = response;
        }
      }

      const tronResponse = {
        body,
        status: xhr.status,
        headers: responseHeaders || {},
      };

      (dreaction as any).apiResponse(
        requestId,
        tronRequest,
        tronResponse,
        stopTimer ? stopTimer() : 0
      );
    };

    /**
     * Intercept fetch API
     */
    const interceptFetch = () => {
      originalFetch = window.fetch;

      window.fetch = function (
        input: RequestInfo | URL,
        init?: RequestInit
      ): Promise<Response> {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof Request
            ? input.url
            : input.toString();

        if (options.ignoreUrls && options.ignoreUrls.test(url)) {
          return originalFetch.call(this, input as RequestInfo, init);
        }

        // Generate unique request ID
        const requestId = generateRequestId();

        const stopTimer = dreaction.startTimer();

        // Parse URL and params
        let params = null;
        const queryParamIdx = url.indexOf('?');
        if (queryParamIdx > -1) {
          params = {} as Record<string, string>;
          url
            .substr(queryParamIdx + 1)
            .split('&')
            .forEach((pair: string) => {
              const [key, value] = pair.split('=');
              if (key && value !== undefined) {
                params![key] = decodeURIComponent(value.replace(/\+/g, ' '));
              }
            });
        }

        // Parse request headers
        let requestHeaders: Record<string, string> = {};
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((value: string, key: string) => {
              requestHeaders[key] = value;
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, value]: [string, string]) => {
              requestHeaders[key] = value;
            });
          } else {
            requestHeaders = init.headers as Record<string, string>;
          }
        }

        const tronRequest = {
          url,
          method: (init?.method || 'GET') as any,
          data: init?.body || null,
          headers: requestHeaders,
          params,
        };

        // Send api.request event
        (dreaction as any).apiRequest(requestId, tronRequest);

        return originalFetch
          .call(this, input as RequestInfo, init)
          .then(async (response) => {
            const contentType = response.headers.get('content-type') || '';

            // Clone the response so we can read it
            const clonedResponse = response.clone();

            let body = `~~~ skipped ~~~`;
            const useRealResponse = !ignoreContentTypes.test(contentType);

            if (useRealResponse) {
              try {
                if (contentType.includes('application/json')) {
                  body = await clonedResponse.json();
                } else {
                  body = await clonedResponse.text();
                }
              } catch (e) {
                // ignore parsing errors
              }
            }

            // Parse response headers
            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value: string, key: string) => {
              responseHeaders[key] = value;
            });

            const tronResponse = {
              body,
              status: response.status,
              headers: responseHeaders,
            };

            (dreaction as any).apiResponse(
              requestId,
              tronRequest,
              tronResponse,
              stopTimer()
            );

            return response;
          });
      };
    };

    /**
     * Restore original functions
     */
    const restoreXHR = () => {
      if (originalXHROpen) {
        XMLHttpRequest.prototype.open = originalXHROpen;
      }
      if (originalXHRSend) {
        XMLHttpRequest.prototype.send = originalXHRSend;
      }
    };

    const restoreFetch = () => {
      if (originalFetch) {
        window.fetch = originalFetch;
      }
    };

    return {
      onConnect: () => {
        // register our interceptors
        if (typeof XMLHttpRequest !== 'undefined') {
          interceptXHR();
        }
        if (
          typeof window !== 'undefined' &&
          typeof window.fetch === 'function'
        ) {
          interceptFetch();
        }
      },
      onDisconnect: () => {
        restoreXHR();
        restoreFetch();
      },
    } satisfies Plugin<DReactionCore>;
  };

export default networking;
