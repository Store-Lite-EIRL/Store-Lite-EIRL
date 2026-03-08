export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: string;
  currency: string;
  status: string;
  image: string;
  images?: string[];
  description?: string;
  brand?: string | null;
  tags?: string[] | null;
  shippingInfo?: string | null;
  saleStatus?: string;
  secondPrice?: string | null;
}

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cotton Man Shirt',
    category: 'Shirt',
    stock: 43,
    price: '245',
    currency: 'PEN',
    status: 'Active',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAqLLlqBwW9i0uJ9a9Mn3RGSd0gZcEs5oa20sT0IMewoKUumaKJ96NDXZgvZRK2kbdY0CWFESLwqzwfBUR5cq2GfamibClVVMTO3dkD_bJ6uxcCxK5nYErQnWnAWYriW48Yz48xMalYgkDALUiT2FUf_rb1wzMEu-lc0MMJoiBmySvikU1tJA6EgFiUyIloKVSwgSgRk5JjRElLnnSSsLzv2YtgTsFXNi6GMHAt22ut0lnEgFZL776iOxjriGVB4dHeSFWcS7dLdJY',
  },
  {
    id: '2',
    name: 'Retoro Multi Sneakers',
    category: 'Shoe',
    stock: 134,
    price: '264',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB-XiYvc8d4JzD1Zx_PzgoLEqgQBdZkXq5tPaJ4MB9L-GfYFwXKwV0mhA7uSdwHy55QCxp0d0SEriZEVyPS3ZmB75gbAskHkeJc3wkBdyDSjK6qaLPmJihO6tfuySWOEm7D5pXAbHvkHVw4Tfr7SLbfKqi3V2QEbU66czlpb0vJ-O_Wm0bAQTMvDADq-awBkXyOVhixVrRPLFUzp_XBfRsgiljRcMEBi6JI8rnQNJcSLsqdGMjGJdQw4-vd_MYPI6pzsuzLpSpO2vU',
  },
  {
    id: '3',
    name: 'Cotton Man Shirt',
    category: 'Polo',
    stock: 535,
    price: '364',
    currency: 'PEN',
    status: 'Active',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDnNy5nHc-UpDftL3FNU9pHrTqRBivpvNs5LdcVsHEpwYRDdDfrVIgz3jQqDWBBgtnDSPPqqbCYtGN5QF0d_fFqgcyQsLQ83XOwO6lYxF_pEudkayLQ51VxEHOuLCTYrOQ3suZV88ZVk8xFPBrfCG1n_DMCqK1t-pTPgSvLsedeQxtUUpvPhmw3Uo4CHa3KzbCiAKzT3KCq1Nc7JpB4j7SOhyoyUu9rst0YQmEnhSEhzSuD3h2WoptARrhtZHHkIrtYE_x9SKT9Pyk',
  },
  {
    id: '4',
    name: 'Open Back Top',
    category: 'Top',
    stock: 643,
    price: '163',
    currency: 'PEN',
    status: 'Draft',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBKKDDgaWvfGS2UEa1jkCx0VRLpEejT8x5K0aDQHCgyFuuixabtGIlmEoK_hA_SCJKVhYgz_XtVYa7__5coNgd0XjvFF8HzYe5JMj97ell5shxDNcza2GXzc6K7uaRy98hSR39muGbr9-2U0fOghjKNFp3hVD4YsHKz7pa52W3WpAcNveM_lGAaMiMH99_zfmsJR-7TXtfxgZj4VzZLMGV-690CThcie8BBhwrtkQty5PPqsqrDdXIUnSyxowjhEVbQ6CujkkApols',
  },
  {
    id: '5',
    name: 'Polo Sweat Shirt',
    category: 'Polo',
    stock: 754,
    price: '234',
    currency: 'PEN',
    status: 'Active',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANbN26D1wBmRipe9Z1SjFEKh7z4TQo23pk1R6hs42y6345KMeBqIHEXvPOPCvxkLptiLLHodAHOMxBZrDBNfVoqKYAlDwUwUqrUbWaR3r0PAiUHXa_d9oQE4SnQw-LSUsrRFx-xBbeTtNLC6Ofdujvxj6Z4UEEW7UanwJLaIJluuMJXm_FGX1_w8Qu5E8TEsP9_lQ4M-aZ1g6rmyj0OGOGfjyBccD02ovj41qYeH42MwzmagQLg7ArxmGl_DpbxfpYlQ0yphSKj5Q',
  },
  {
    id: '6',
    name: 'Cotton knitwear',
    category: 'Knitwear',
    stock: 743,
    price: '134',
    currency: 'PEN',
    status: 'Active',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCO_lMflaJOwTfMuHcccfzDpV1RlnXECNv-CRxzG4dgGu5VdJJWYmL0ZsOa7ZQwX31t4SuE8nGu2ADloJwNjTtkvcIgyB7jkPIi1i1YOtzYD2PMqZGBZgL6aoUwaTts5UccKlDvEdmy9SI8RKuT-dcz7UDZBXdn92zpa-rfOlu1HDCHsXZ6NVMvpyUlm_dAv1EGUq-c6wYwKPFBN48lJnZmd-c4QlTVWKkdJ-mFdk-k3vkmo5LOPqHM0H0dBPWUXH61RrRfgQZKty4',
  },
  {
    id: '7',
    name: 'Bag with compartme',
    category: 'Bag',
    stock: 664,
    price: '422',
    currency: 'PEN',
    status: 'Draft',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAwwftghgDuZuuwq8nadPQ1YPyWfMeLOTWSLxf_2DK_sRl_dkqSv670iIhCwdyQEahTkDnqM_7BNs9poqJWu_XSzKtdetryqjwWZWvAKua2saJJw0cB97AuicZfEzbgg9rU2yEy-AVENbbYAtWjpWqyMULxYgMQQFl6piP4eqdO-9uSvMy8Y1t5LnB21PCWruMkgBBbU6cjDQ5SO8BzziJMQziLqhymAPCPggvJ7fHlDLg7mtpSrmdu3fFfgKV6Py1WsABpfZZspQM',
  },
  {
    id: '8',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '9',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '10',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '11',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '12',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '13',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '14',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '15',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '16',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '17',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '18',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '19',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '20',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '21',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '22',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
  {
    id: '23',
    name: 'Tailored blend waistcoat',
    category: 'Waistcoat',
    stock: 34,
    price: '165',
    currency: 'PEN',
    status: 'Pending',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwxo7JHTmAVFOuMwLmKbRq1waVUavz9AmWq5k0kdJEaK7sS7459ymkRr49vrLRBgtBVmKoGfg6QmODH_ZNbZOHDu3QGvm3xSrF4p4VPaiVbAHSijP83NOaULhkvRPRMIo51xaIa3VzQP7Tz2vwWXTRVzlMtn3mF6HWpR7vNoLu7rK9vaR6eEy7VSmhN0p_3bzqJhBBx_VfY8K__fQyp8XTKuahzl3jNyI3ObGcpQTEVa1etpSsyapzUugjdRw37SQRwR5jBLP1cgM',
  },
];
