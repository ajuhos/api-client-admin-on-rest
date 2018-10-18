import * as ReactAdmin from 'react-admin'

const queryParameters = (query: any) => {
    const list = [],
        keys = Object.keys(query);

    for (let key of keys) {
        if(key === 'where') {
            const filteredKeys = Object.keys(query.where);
            for (let filteredKey of filteredKeys) {
                const filters = Object.keys(query.where[filteredKey]);
                for (let filter of filters) {
                    list.push(`where[${filteredKey}][${filter}]=${query.where[filteredKey][filter]}`)
                }
            }
        }
        else {
            list.push(`${key}=${query[key]}`)
        }
    }

    return list.join('&')
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
export const restClient = (apiUrl: string, httpClient = ReactAdmin.fetchUtils.fetchJson) => {
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
            case ReactAdmin.GET_LIST: {
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
            case ReactAdmin.GET_MANY_REFERENCE: {
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
            case ReactAdmin.GET_ONE:
                url = `${apiUrl}/${resource}/${params.id}`;
                break;
            case ReactAdmin.GET_MANY:
                url = `${apiUrl}/${resource}?where[id][in]=${params.ids.join(',')}`;
                break;
            case ReactAdmin.UPDATE:
                url = `${apiUrl}/${resource}/${params.id}`;
                options.method = 'PUT';
                options.body = JSON.stringify(params.data);
                break;
            case ReactAdmin.CREATE:
                url = `${apiUrl}/${resource}`;
                options.method = 'POST';
                options.body = JSON.stringify(params.data);
                break;
            case ReactAdmin.DELETE:
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
            case ReactAdmin.GET_LIST:
            case ReactAdmin.GET_MANY_REFERENCE:
                if (!headers.has('x-total-count')) {
                    throw new Error('The X-Total-Count header is missing in the HTTP Response. The api-core REST client expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare X-Total-Count in the Access-Control-Expose-Headers header?');
                }
                return {
                    data: json,
                    total: parseInt(headers.get('x-total-count'), 10),
                };
            case ReactAdmin.CREATE:
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
        return request(type, resource, params)
    };
};