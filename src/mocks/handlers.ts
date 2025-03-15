const { http, HttpResponse } = require('msw');

const handlers = [
  http.post('/api/verification/upload', async () => {
    return HttpResponse.json({ success: true, id: '123' });
  }),

  http.get('/api/verification/requests', () => {
    return HttpResponse.json([
      {
        id: '1',
        userId: 'user-001',
        status: 'pending',
        createdAt: new Date().toISOString(),
        imageUrl: 'https://placehold.co/300x400',
      },
      {
        id: '2',
        userId: 'user-002',
        status: 'pending',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        imageUrl: 'https://placehold.co/300x400',
      },
    ]);
  }),

  http.patch('/api/verification/requests/:id/approve', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ success: true, id });
  }),

  http.patch('/api/verification/requests/:id/reject', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ success: true, id });
  }),
];

module.exports = { handlers }; 