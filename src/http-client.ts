/**
 * direct JavaScript Toolbox
 * All-in-one toolbox to provide more reusable JavaScript features
 *
 * (C) direct Netware Group - All rights reserved
 * https://www.direct-netware.de/redirect?djt;http_client
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/.
 *
 * https://www.direct-netware.de/redirect?licenses;mpl2
 *
 * @license Mozilla Public License, v. 2.0
 */

import { HttpClientQueryParams, HttpClientRequestArgs, HttpClientRequestData, HttpClientResponse, MapObject } from './http-client-interfaces';

import { parse as uriParse } from 'uri-js';

/**
 * Minimal HTTP client abstraction layer returning raw responses.
 *
 * @author    direct Netware Group
 * @copyright (C) direct Netware Group - All rights reserved
 * @package   djt-http-client
 * @since     v1.0.0
 * @license   https://www.direct-netware.de/redirect?licenses;mpl2
 *            Mozilla Public License, v. 2.0
 */
export class HttpClient {
    /**
     * List of supported schemes.
     */
    protected static readonly COMPATIBLE_SCHEMES = [ 'http', 'https' ];

    /**
     * Request authorization username
     */
    public authUsername: string;
    /**
     * Request authorization password
     */
    protected authPassword: string;
    /**
     * fetch Request instance
     */
    protected _requestInstance: Request;
    /**
     * Request host
     */
    public host: string;
    /**
     * Request path
     */
    public path: string;
    /**
     * Request port
     */
    public port: number;
    /**
     * True if the client returns a callable reader supporting a size argument.
     */
    protected returnRawResponse: boolean;
    /**
     * Request scheme
     */
    public scheme: string;
    /**
     * Socket timeout in milliseconds
     */
    protected timeout: number;

    /**
     * Constructor (HttpClient)
     *
     * @param url URL to be called
     * @param timeout Socket timeout
     * @param returnRawResponse Returns the raw response instead of reading the
     *        response if true.
     *
     * @since v1.0.0
     */
    constructor(url: string, timeout = 30, returnRawResponse = false) {
        this.returnRawResponse = returnRawResponse;
        this.timeout = (timeout * 1000);

        this.configure(url);
    }

    /**
     * Returns the corresponding class of the calling instance.
     *
     * @return Class object
     * @since  v1.0.0
     */
    protected get instanceClass() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
        return Object.getPrototypeOf(this).constructor;
    }

    /**
     * Returns the URL used for all subsequent requests.
     *
     * @return URL to be called
     * @since  v1.0.0
     */
    public get url() {
        return this._requestInstance.url;
    }

    /**
     * Sets a new URL used for all subsequent requests.
     *
     * @param url URL to be called
     *
     * @since v1.0.0
     */
    public set url(url: string) {
        this.configure(url);
    }

    /**
     * Build a HTTP query string based on the given parameters and the separator.
     *
     * @param params Query parameters object
     * @param separator Query parameter separator
     * @param _ True if parameters are sent as body payload
     *
     * @return Formatted query string
     * @since  v1.0.0
     */
    protected buildRequestParameters(params?: HttpClientQueryParams, separator = ';', _ = false) {
        let _return = null;

        if (typeof params != 'string') {
            const paramsList = [ ];

            for (const key of Object.keys(params)) {
                if (typeof params[key] != 'boolean') {
                    paramsList.push(
                        HttpClient.encode(key)
                        + '='
                        + HttpClient.encode(typeof params[key] == 'object' ? params[key].toString() : params[key] as string)
                    );
                } else if (params[key]) {
                    paramsList.push(HttpClient.encode(key) + '=1');
                } else {
                    paramsList.push(HttpClient.encode(key) + '=0');
                }
            }

            _return = paramsList.join(separator);
        }

        return _return;
    }

    /**
     * Configures the HTTP request for later use.
     *
     * @param url URL to be called
     *
     * @since v1.0.0
     */
    protected configure(url: string) {
        const urlData = uriParse(url);
        const scheme = (urlData.scheme ? urlData.scheme.toLowerCase() : '');

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        if ((!scheme) || (!this.instanceClass.COMPATIBLE_SCHEMES.includes(scheme)) || (!urlData.host)) {
            throw new Error('Given URL is not an HTTP client compatible resource');
        }

        this.scheme = scheme;

        if (urlData.userinfo) {
            const authData = urlData.userinfo.split(':', 2);

            this.authUsername = authData[0];
            this.authPassword = (authData.length > 1 ? authData.slice(1).join(':') : '');
        }

        this.host = urlData.host;
        this.path = (urlData.path ? urlData.path : '/');
        this.port = (typeof urlData.port == 'number' ? urlData.port : parseInt(urlData.port, 10));

        this._requestInstance = this.configureFromUrl(url);
    }

    /**
     * Configures a new HTTP request based on the given URL and the existing
     * instance request object.
     *
     * @param url URL to be called
     *
     * @return HTTP request instance
     * @since  v1.0.0
     */
    protected configureFromUrl(url: string) {
        let cache: RequestCache;
        let credentials: RequestCredentials;
        let headers: Headers;
        let redirect: RequestRedirect;

        if (this._requestInstance) {
            cache = this._requestInstance.cache;
            credentials = this._requestInstance.credentials;
            headers = this._requestInstance.headers;
            redirect = this._requestInstance.redirect;
        } else {
            cache = 'default';
            credentials = 'include';
            headers = new Headers();
            redirect = 'follow';
        }

        return new Request(url, { cache, credentials, headers, mode: 'cors', redirect });
    }

    /**
     * Sends the request and returns either the response or an timeout error.
     *
     * @param request HTTP request to be send
     * @param additionalRequestArgs Additional request arguments to be applied
     *
     * @return Response promise
     * @since  v1.0.1
     */
    protected fetchWithTimeout(request: Request, additionalRequestArgs: RequestInit) {
        return new Promise(
            (resolve: (value: Response) => void, reject: (reason: Error) => void) => {
                let timeoutId: number;

                if (typeof AbortController == 'undefined') {
                    timeoutId = self.setTimeout(
                        () => { reject(new Error('Timeout occurred')); },
                        this.timeout
                    );
                } else {
                    const abortController = new AbortController();
                    additionalRequestArgs['signal'] = abortController.signal;

                    timeoutId = self.setTimeout(
                        () => { abortController.abort(); },
                        this.timeout
                    );
                }

                fetch(request, additionalRequestArgs)
                .then(
                    (response: Response) => {
                        self.clearTimeout(timeoutId);
                        resolve(response);
                    }
                )
                .catch(reject);
            }
        );
    }

    /**
     * Call a given request method on the configured HTTP server.
     *
     * @param method HTTP method
     * @param separator Query parameter separator
     * @param params Parsed query parameters as str
     * @param data HTTP body
     *
     * @return Response data; 'body' may contain the catched exception
     * @since  v1.0.0
     */
    public async request(method: string, separator = ';', params?: HttpClientQueryParams, data?: HttpClientRequestData) {
        let _return;

        try {
            const headers = this._requestInstance.headers;
            const requestArgs: HttpClientRequestArgs = { headers };

            if (typeof params == 'string') {
                requestArgs['params'] = params;
                requestArgs['separator'] = separator;
            }

            if (
                (typeof Blob != 'undefined' && data instanceof Blob)
                || (typeof ArrayBuffer != 'undefined' && data instanceof ArrayBuffer)
                || (typeof ReadableStream != 'undefined' && data instanceof ReadableStream)
                || (typeof data == 'string')
            ) {
                requestArgs['body'] = data;
            } else if (data instanceof Object) {
                if (!headers.has('content-type')) {
                    headers.set('Content-Type', 'application/x-www-form-urlencoded');
                }

                requestArgs['body'] = this.buildRequestParameters(data as unknown as HttpClientQueryParams, '&', true);
            }

            if (this.authUsername) {
                headers.set('Authorization', 'Basic ' + btoa(this.authUsername + ':' + this.authPassword));
            }

            _return = await this._request(method, requestArgs);
        } catch (handledException) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            _return = { code: undefined, headers: undefined, body: handledException } as HttpClientResponse;
        }

        return _return;
    }

    /**
     * Sends the request to the configured HTTP server and returns the result.
     *
     * @param method HTTP method
     * @param requestArgs Request arguments to be used
     *
     * @return Response data; 'body' may contain the catched Exception
     * @since  v1.0.0
     */
    protected async _request(method: string, requestArgs: HttpClientRequestArgs) {
        let request;

        if (requestArgs.params) {
            let url = this.scheme + '://' + this.host + this.path;

            if (!requestArgs.params.includes('?')) {
                url += '?';
            }

            url += requestArgs.params;

            request = this.configureFromUrl(url);
        } else {
            request = this._requestInstance;
        }

        const additionalRequestArgs = { method, headers: requestArgs.headers } as RequestInit;

        if (requestArgs.body) {
            additionalRequestArgs['body'] = requestArgs.body;
        }

        const response = await (
            (this.timeout > 0)
            ? this.fetchWithTimeout(request, additionalRequestArgs)
            : fetch(request, additionalRequestArgs)
        );

        const responseHeaders = { } as MapObject;

        // Good old legacy code strikes here
        if ('forEach' in response.headers) {
            response.headers.forEach(
                (value: string, name: string) => {
                    responseHeaders[name.toLowerCase().replace(/-/g, '_')] = value;
                }
            );
        } else if ('entries' in response.headers) {
            const headers = response.headers as Map<string, unknown>;

            for (const header of headers.entries()) {
                responseHeaders[header[0].toLowerCase().replace(/-/g, '_')] = header[1];
            }
        }

        const _return: HttpClientResponse = { code: response.status, headers: responseHeaders, body: null };

        if (this.returnRawResponse) {
            _return['rawResponse'] = response;
        }

        if (!response.ok) {
            _return.body = new Error(String(response.status) + response.statusText);
        } else if (method !== 'HEAD' && (!this.returnRawResponse)) {
            _return.body = await response.blob();
        }

        return _return;
    }

    /**
     * Do a DELETE request on the connected HTTP server.
     *
     * @param params Query parameters object
     * @param separator Query parameter separator
     * @param data HTTP body
     *
     * @return Response data; Exception on error
     * @since  v1.0.0
     */
    public async requestDelete(params?: HttpClientQueryParams, separator = ';', data?: HttpClientRequestData) {
        params = this.buildRequestParameters(params, separator);
        return this.request('DELETE', separator, params, data);
    }

    /**
     * Do a GET request on the connected HTTP server.
     *
     * @param params Query parameters object
     * @param separator Query parameter separator
     *
     * @return Response data; Exception on error
     * @since  v1.0.0
     */
    public async requestGet(params?: HttpClientQueryParams, separator = ';') {
        params = this.buildRequestParameters(params, separator);
        return this.request('GET', separator, params);
    }

    /**
     * Do a HEAD request on the connected HTTP server.
     *
     * @param params Query parameters object
     * @param separator Query parameter separator
     *
     * @return Response data; Exception on error
     * @since  v1.0.0
     */
    public async requestHead(params?: HttpClientQueryParams, separator = ';') {
        params = this.buildRequestParameters(params, separator);
        return this.request('HEAD', separator, params);
    }

    /**
     * Do a PATCH request on the connected HTTP server.
     *
     * @param data HTTP body
     * @param params Query parameters object
     * @param separator Query parameter separator
     *
     * @return Response data; Exception on error
     * @since  v1.0.0
     */
    public async requestPatch(data?: HttpClientRequestData, params?: HttpClientQueryParams, separator = ';') {
        params = this.buildRequestParameters(params, separator);
        return this.request('PATCH', separator, params, data);
    }

    /**
     * Do a POST request on the connected HTTP server.
     *
     * @param data HTTP body
     * @param params Query parameters object
     * @param separator Query parameter separator
     *
     * @return Response data; Exception on error
     * @since  v1.0.0
     */
    public async requestPost(data?: HttpClientRequestData, params?: HttpClientQueryParams, separator = ';') {
        params = this.buildRequestParameters(params, separator);
        return this.request('POST', separator, params, data);
    }

    /**
     * Do a PUT request on the connected HTTP server.
     *
     * @param data HTTP body
     * @param params Query parameters object
     * @param separator Query parameter separator
     *
     * @return Response data; Exception on error
     * @since  v1.0.0
     */
    public async requestPut(data?: HttpClientRequestData, params?: HttpClientQueryParams, separator = ';') {
        params = this.buildRequestParameters(params, separator);
        return this.request('PUT', separator, params, data);
    }

    /**
     * Do a OPTIONS request on the connected HTTP server.
     *
     * @param params Query parameters object
     * @param separator Query parameter separator
     * @param data HTTP body
     *
     * @return Response data; Exception on error
     * @since  v1.0.0
     */
    public async requestOptions(params?: HttpClientQueryParams, separator = ';', data?: HttpClientRequestData) {
        params = this.buildRequestParameters(params, separator);
        return this.request('OPTIONS', separator, params, data);
    }

    /**
     * Do a TRACE request on the connected HTTP server.
     *
     * @param params Query parameters object
     * @param separator Query parameter separator
     *
     * @return Response data; Exception on error
     * @since  v1.0.0
     */
    public async requestTrace(params?: HttpClientQueryParams, separator = ';') {
        params = this.buildRequestParameters(params, separator);
        return this.request('TRACE', separator, params);
    }

    /**
     * Resets previously set headers.
     *
     * @since v1.0.0
     */
    public resetHeaders() {
        if (this._requestInstance) {
            this._requestInstance = new Request(this._requestInstance, { headers: new Headers() });
        }
    }

    /**
     * Sets the basic authentication data.
     *
     * @param username Username
     * @param password Password
     *
     * @since v1.0.0
     */
    public setBasicAuth(username?: string, password?: string) {
        this.authUsername = (username ? username : '');
        this.authPassword = (password ? password : '');
    }

    /**
     * Sets a header.
     *
     * @param name Header name
     * @param value Header value as string or array
     * @param valueAppends True if headers should be appended
     *
     * @since v1.0.0
     */
    public setHeader(name: string, value: string | string[], valueAppends = false) {
        name = name.toLowerCase();

        if (value === undefined) {
            if (this._requestInstance.headers.has(name)) {
                this._requestInstance.headers.delete(name);
            }
        } else if ((!this._requestInstance.headers.has(name)) || valueAppends) {
            if (!Array.isArray(value)) {
                value = [ value ];
            }

            for (const entry of value) {
                this._requestInstance.headers.append(name, entry);
            }
        }
    }

    /**
     * Encode special characters for a RFC 2396 compliant URI.
     *
     * @param value Input string
     *
     * @return Encoded string
     * @since  v1.0.0
     */
    protected static encode(value: string) {
        return encodeURIComponent(value).replace('%20', '+');
    }
}
