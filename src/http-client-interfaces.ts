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

/**
 * Query parameters supported for the HTTP client
 *
 * @since v1.1.0
 */
export type HttpClientQueryParams = ({ body?: BodyInit, headers?: Headers } & MapObject) | string;

/**
 * Request arguments for the HTTP client
 *
 * @since v1.1.0
 */
export type HttpClientRequestArgs = { body?: BodyInit, headers?: Headers, params?: string, separator?: string };

/**
 * Request data
 *
 * @since v1.1.0
 */
export type HttpClientRequestData = BodyInit | unknown;

/**
 * Response for HTTP client requests
 *
 * @since v1.1.0
 */
export type HttpClientResponse = {
    code: number,
    headers: MapObject,
    body: unknown,
    rawResponse?: Response
};

/**
 * Object in "Map" like format
 *
 * @since v1.0.0
 */
export type MapObject = { [key: string]: unknown };
