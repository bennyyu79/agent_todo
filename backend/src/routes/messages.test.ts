import request from 'supertest';
import express from 'express';
import { applyMessageRoutes } from './messages';

describe('Messages API', () => {
  let app: express.Express;
  let broadcastMock: jest.Mock;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    broadcastMock = jest.fn();
    applyMessageRoutes(app, broadcastMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/messages/team/:teamId', () => {
    it('should return messages for a team', async () => {
      const response = await request(app)
        .get('/api/messages/team/test-team')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array for team with no messages', async () => {
      const response = await request(app)
        .get('/api/messages/team/non-existent-team')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/messages/recent/:limit', () => {
    it('should return recent messages with default limit', async () => {
      const response = await request(app)
        .get('/api/messages/recent')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return recent messages with custom limit', async () => {
      const response = await request(app)
        .get('/api/messages/recent/10')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });
  });

  describe('POST /api/messages/add', () => {
    it('should add a new message', async () => {
      const newMessage = {
        sender: 'test-agent',
        senderType: 'agent',
        content: 'Test message content',
        teamId: 'test-team'
      };

      const response = await request(app)
        .post('/api/messages/add')
        .send(newMessage)
        .expect(200);

      expect(response.body).toMatchObject({
        sender: newMessage.sender,
        content: newMessage.content,
        teamId: newMessage.teamId
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should use default values for optional fields', async () => {
      const response = await request(app)
        .post('/api/messages/add')
        .send({ content: 'Minimal message' })
        .expect(200);

      expect(response.body.sender).toBe('system');
      expect(response.body.senderType).toBe('system');
      expect(response.body.teamId).toBe('default');
    });
  });
});
