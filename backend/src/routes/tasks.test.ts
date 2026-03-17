import request from 'supertest';
import express from 'express';
import { applyTaskRoutes } from './tasks';

describe('Tasks API', () => {
  let app: express.Express;
  let broadcastMock: jest.Mock;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    broadcastMock = jest.fn();
    applyTaskRoutes(app, broadcastMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return a task by id', async () => {
      // First create a task
      const created = await request(app)
        .post('/api/tasks')
        .send({
          subject: 'Test Task',
          description: 'Test Description'
        })
        .expect(201);

      // Then get it
      const response = await request(app)
        .get(`/api/tasks/${created.body.id}`)
        .expect(200);

      expect(response.body.id).toBe(created.body.id);
      expect(response.body.subject).toBe('Test Task');
    });

    it('should return 404 for non-existent task', async () => {
      await request(app)
        .get('/api/tasks/non-existent-id')
        .expect(404);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        subject: 'Test Task',
        description: 'Test Description',
        status: 'pending'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body).toMatchObject({
        subject: newTask.subject,
        description: newTask.description,
        status: newTask.status
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return 400 if subject is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ description: 'Test' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should return 400 if description is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ subject: 'Test' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should broadcast task_created event', async () => {
      await request(app)
        .post('/api/tasks')
        .send({
          subject: 'Test Task',
          description: 'Test Description'
        });

      expect(broadcastMock).toHaveBeenCalledWith('task_created', expect.any(Object));
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update an existing task', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({
          subject: 'Original',
          description: 'Original Description'
        });

      const response = await request(app)
        .put(`/api/tasks/${created.body.id}`)
        .send({ subject: 'Updated' })
        .expect(200);

      expect(response.body.subject).toBe('Updated');
      expect(response.body.description).toBe('Original Description');
    });

    it('should return 404 for non-existent task', async () => {
      await request(app)
        .put('/api/tasks/non-existent-id')
        .send({ subject: 'Update' })
        .expect(404);
    });

    it('should broadcast task_updated event', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({
          subject: 'Original',
          description: 'Original Description'
        });

      await request(app)
        .put(`/api/tasks/${created.body.id}`)
        .send({ status: 'completed' });

      expect(broadcastMock).toHaveBeenCalledWith('task_updated', expect.any(Object));
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({
          subject: 'To Delete',
          description: 'Will be deleted'
        });

      await request(app)
        .delete(`/api/tasks/${created.body.id}`)
        .expect(204);

      await request(app)
        .get(`/api/tasks/${created.body.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      await request(app)
        .delete('/api/tasks/non-existent-id')
        .expect(404);
    });

    it('should broadcast task_deleted event', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({
          subject: 'To Delete',
          description: 'Will be deleted'
        });

      await request(app)
        .delete(`/api/tasks/${created.body.id}`);

      expect(broadcastMock).toHaveBeenCalledWith('task_deleted', expect.any(Object));
    });
  });
});
