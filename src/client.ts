const RequestType = require('admin-on-rest/lib/rest/types'),
    fetchJSON = require('admin-on-rest/lib/util/fetch').fetchJson;

const queryParameters = (query: any) => {
    return Object.keys(query).map(q => q+'='+query[q]).join('&')
};

/**
 * Maps admin-on-rest queries to a simple REST API
 *
 * The REST dialect is similar to the one of FakeRest
 * @see https://github.com/marmelab/FakeRest
 * @example
 * GET_LIST     => GET http://my.api.url/posts?sort=['title','ASC']&range=[0, 24]
 * GET_ONE      => GET http://my.api.url/posts/123
 * GET_MANY     => GET http://my.api.url/posts?filter={ids:[123,456,789]}
 * UPDATE       => PUT http://my.api.url/posts/123
 * CREATE       => POST http://my.api.url/posts/123
 * DELETE       => DELETE http://my.api.url/posts/123
 */
export const restClient = (apiUrl: string, httpClient = fetchJSON) => {
    /**
     * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
     * @param {String} resource Name of the resource to fetch, e.g. 'posts'
     * @param {Object} params The REST request params, depending on the type
     * @returns {Object} { url, options } The HTTP request parameters
     */
    const convertRESTRequestToHTTP = (type: string, resource: string, params: any) => {
        let url = '';
        const options: { method?: string, body?: any } = {};
        switch (type) {
            case RequestType.GET_LIST: {
                const { page, perPage } = params.pagination;
                const { field, order } = params.sort;
                let query:any = {
                    sort:  (order === 'ASC' ? '' : '-') + field,
                    skip: (page-1) * perPage,
                    limit: perPage,
                    ...params.filter
                };
                url = `${apiUrl}/${resource}?${queryParameters(query)}`;
                break;
            }
            case RequestType.GET_MANY_REFERENCE: {
                const { page, perPage } = params.pagination;
                const { field, order } = params.sort;
                const query = {
                    sort:  (order === 'ASC' ? '' : '-') + field,
                    skip: (page-1) * perPage,
                    limit: perPage,
                    ...params.filter,
                    [params.target]: params.id
                };
                url = `${apiUrl}/${resource}?${queryParameters(query)}`;
                break;
            }
            case RequestType.GET_ONE:
                url = `${apiUrl}/${resource}/${params.id}`;
                break;
            case RequestType.UPDATE:
                url = `${apiUrl}/${resource}/${params.id}`;
                options.method = 'PUT';
                options.body = JSON.stringify(params.data);
                break;
            case RequestType.CREATE:
                url = `${apiUrl}/${resource}`;
                options.method = 'POST';
                options.body = JSON.stringify(params.data);
                break;
            case RequestType.DELETE:
                url = `${apiUrl}/${resource}/${params.id}`;
                options.method = 'DELETE';
                break;
            default:
                throw new Error(`Unsupported fetch action type ${type}`);
        }
        return { url, options };
    };

    /**
     * @param {Object} response HTTP response from fetch()
     * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
     * @param {String} resource Name of the resource to fetch, e.g. 'posts'
     * @param {Object} params The REST request params, depending on the type
     * @returns {Object} REST response
     */
    const convertHTTPResponseToREST = (response: any, type: string, resource: string, params: any) => {
        const { headers, json } = response;
        switch (type) {
            case RequestType.GET_LIST:
            case RequestType.GET_MANY_REFERENCE:
                if (!headers.has('x-total-count')) {
                    throw new Error('The X-Total-Count header is missing in the HTTP Response. The api-core REST client expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare X-Total-Count in the Access-Control-Expose-Headers header?');
                }
                return {
                    data: json,
                    total: parseInt(headers.get('x-total-count'), 10),
                };
            case RequestType.CREATE:
                return { data: { ...params.data, id: json.id } };
            default:
                return { data: json };
        }
    };

    const request = (type: string, resource: string, params: any) => {
        const {url, options} = convertRESTRequestToHTTP(type, resource, params);
        return httpClient(url, options)
            .then((response: any) => convertHTTPResponseToREST(response, type, resource, params));
    };

    /**
     * @param {string} type Request type, e.g GET_LIST
     * @param {string} resource Resource name, e.g. "posts"
     * @param {Object} payload Request parameters. Depends on the request type
     * @returns {Promise} the Promise for a REST response
     */
    return (type: string, resource: string, params: any) => {
        if(type === RequestType.GET_MANY) {
            return Promise.all(
                    params.ids.map((id: string) => request(RequestType.GET_ONE, resource, { id }))
                )
                .then((responses: any[]) => ({ data: responses.map(r => r.data) }))
        }
        else {
            return request(type, resource, params)
        }
    };
};