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

import { HttpClient } from './http-client';

/**
 * HTTP client abstraction layer for JSON-encoded requests and responses.
 *
 * @author    direct Netware Group
 * @copyright (C) direct Netware Group - All rights reserved
 * @package   djt-http-client
 * @since     v1.0.0
 * @license   https://www.direct-netware.de/redirect?licenses;mpl2
 *            Mozilla Public License, v. 2.0
 */
export class HttpJsonClient extends HttpClient {
    /**
     * Constructor (HttpClient)
     *
     * @param url URL to be called
     * @param timeout Socket timeout
     *
     * @since v1.0.0
     */
    constructor(url: string, timeout = 30) {
        super(url, timeout, true);
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
    // tslint:disable-next-line:no-any
    public async request(method: string, separator = ';', params?: any, data?: any) {
        if (data) {
            if (data instanceof Object) {
                if (!this._requestInstance.headers.has('accept')) {
                    this._requestInstance.headers.set('accept', 'application/json');
                }

                if (!this._requestInstance.headers.has('content-type')) {
                    this._requestInstance.headers.set('content-type', 'application/json');
                }

                data = JSON.stringify(data);
            }
        }

        return super.request(method, separator, params, data);
    }

    /**
     * Sends the request to the configured HTTP server and returns the result.
     * @param method HTTP method
     * @param requestArgs Request arguments to be used
     *
     * @return Response data; 'body' may contain the catched Exception
     * @since  v1.0.0
     */
    // tslint:disable-next-line:no-any
    protected async _request(method: string, requestArgs: any) {
        const _return = await super._request(method, requestArgs);

        if (_return.rawResponse instanceof Response) {
            _return.body = await _return.rawResponse.json();
            delete(_return.rawResponse);
        }

        return _return;
    }
}
