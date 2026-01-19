// @ts-ignore
import { XHRInterceptor } from './xhrInterceptor';
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

    /**
     * Fires when we talk to the server.
     *
     * @param {*} data - The data sent to the server.
     * @param {*} instance - The XMLHTTPRequest instance.
     */
    function onSend(data: any, xhr: any) {
      if (options.ignoreUrls && options.ignoreUrls.test(xhr._url)) {
        xhr._skipDReaction = true;
        return;
      }

      // Generate unique request ID
      const requestId = generateRequestId();

      // tag
      xhr._trackingName = requestId;

      // Parse URL and params
      const url = xhr._url;
      let params: Record<string, string> | null = null;
      const queryParamIdx = url ? url.indexOf('?') : -1;
      if (queryParamIdx > -1) {
        params = {};
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
        headers: xhr._headers || {},
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
    }

    /**
     * Fires when the server gives us a response.
     *
     * @param {number} status - The HTTP response status.
     * @param {boolean} timeout - Did we timeout?
     * @param {*} response - The response data.
     * @param {string} url - The URL we talked to.
     * @param {*} type - Not sure.
     * @param {*} xhr - The XMLHttpRequest instance.
     */
    function onResponse(
      status: any,
      timeout: any,
      response: any,
      url: any,
      type: any,
      xhr: any
    ) {
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

      // what type of content is this?
      const contentType =
        (xhr.responseHeaders && xhr.responseHeaders['content-type']) ||
        (xhr.responseHeaders && xhr.responseHeaders['Content-Type']) ||
        '';

      const sendResponse = (responseBodyText: string) => {
        let body: any = `~~~ skipped ~~~`;
        if (responseBodyText) {
          try {
            // all i am saying, is give JSON a chance...
            body = JSON.parse(responseBodyText);
          } catch (boom) {
            body = response;
          }
        }
        const tronResponse = {
          body,
          status,
          headers: xhr.responseHeaders || {},
        };
        (dreaction as any).apiResponse(
          requestId,
          tronRequest,
          tronResponse,
          stopTimer ? stopTimer() : 0
        );
      };

      // can we use the real response?
      const useRealResponse =
        (typeof response === 'string' || typeof response === 'object') &&
        !ignoreContentTypes.test(contentType || '');

      // prepare the right body to send
      if (useRealResponse) {
        if (type === 'blob' && typeof FileReader !== 'undefined' && response) {
          // Disable reason: FileReader should be in global scope since RN 0.54
          // eslint-disable-next-line no-undef
          const bReader = new FileReader();
          const brListener = () => {
            sendResponse(String(bReader.result));
            bReader.removeEventListener('loadend', brListener);
          };
          bReader.addEventListener('loadend', brListener);
          bReader.readAsText(response);
        } else {
          sendResponse(response);
        }
      } else {
        sendResponse('');
      }
    }

    return {
      onConnect: () => {
        // register our monkey-patch
        XHRInterceptor.setSendCallback(onSend);
        XHRInterceptor.setResponseCallback(onResponse);
        XHRInterceptor.enableInterception();
      },
    } satisfies Plugin<DReactionCore>;
  };
export default networking;
