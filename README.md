### API Core Client for Admin on REST

REST client for the admin-on-rest package to work with api-core based APIs.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/ajuhos/api-client-admin-on-rest/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/ajuhos/api-client-admin-on-rest.svg)](https://github.com/ajuhos/api-client-admin-on-rest/issues)
[![Build Status](https://travis-ci.org/ajuhos/api-client-admin-on-rest.svg?branch=master)](https://travis-ci.org/ajuhos/api-client-admin-on-rest)
[![Coverage Status](https://coveralls.io/repos/github/ajuhos/api-client-admin-on-rest/badge.svg?branch=master)](https://coveralls.io/github/ajuhos/api-client-admin-on-rest?branch=master)

## Installation

To install the latest version, use NPM:

```bash
$ npm install api-client-admin-on-rest
```

## Usage

For example in the [tutorial](https://marmelab.com/admin-on-rest/Tutorial.html) you can simply replace the built in rest client with this one:

```jsx
import React from 'react';
import { restClient } from 'api-client-admin-on-rest';
import { Admin, Resource } from 'admin-on-rest';

import { PostList } from './posts';

const App = () => (
    <Admin restClient={restClient('http://api.example.com')}>
      <Resource name="posts" list={PostList} />
    </Admin>
);

export default App;
```

## Tests

Coming soon...

## License

The [MIT License](https://github.com/ajuhos/api-client-admin-on-rest/blob/master/LICENSE). Free forever. :)