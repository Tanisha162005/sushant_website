import http from 'k6/http';
import { check } from 'k6';

export const options = {
  hosts: {
    'sushantghadge.com': '200.141.9.168',
  },

  scenarios: {
    concurrent_test: {
      executor: 'constant-vus',
      vus: 250,
      duration: '30s',
    },
  },
};

export default function () {
  const res = http.get('https://sushantghadge.com', {
    headers: {
      Host: 'sushantghadge.com',
    },
  });

  check(res, {
    'request successful': (r) => r.status === 200,
  });
}