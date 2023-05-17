import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/contents/[username]/[slug]/parent', () => {
  describe('Anonymous user', () => {
    test('From "root" content with "draft" status', async () => {
      const defaultUser = await orchestrator.createUser();
      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'draft',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/parent`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O conteúdo informado não foi encontrado no sistema.',
        action: 'Verifique se os dados foram digitados corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:CONTENT:PARENT:GET_HANDLER:CONTENT_NOT_FOUND',
        key: 'slug',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('From "root" content with "deleted" status', async () => {
      const defaultUser = await orchestrator.createUser();
      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'published',
      });

      await orchestrator.updateContent(rootContent.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/parent`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O conteúdo informado não foi encontrado no sistema.',
        action: 'Verifique se os dados foram digitados corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:CONTENT:PARENT:GET_HANDLER:CONTENT_NOT_FOUND',
        key: 'slug',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('From "root" content with "published" status', async () => {
      const defaultUser = await orchestrator.createUser();
      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/parent`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O conteúdo requisitado é um conteúdo raiz.',
        action:
          'Busque apenas por conteúdos com "parent_id", pois este conteúdo não possui níveis superiores na árvore de conteúdos.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:CONTENT:PARENT:GET_HANDLER:ALREADY_ROOT',
        key: 'parent_id',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('From "child" content 1 level deep with "draft" status', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const rootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root content title',
        body: 'Root content body',
        status: 'published',
      });

      const childContentLevel1 = await orchestrator.createContent({
        owner_id: secondUser.id,
        parent_id: rootContent.id,
        title: 'Child content title Level 1',
        body: 'Child content body Level 1',
        status: 'draft',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContentLevel1.slug}/parent`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O conteúdo informado não foi encontrado no sistema.',
        action: 'Verifique se os dados foram digitados corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:CONTENT:PARENT:GET_HANDLER:CONTENT_NOT_FOUND',
        key: 'slug',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('From "child" content 1 level deep with "deleted" status', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const rootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root content title',
        body: 'Root content body',
        status: 'published',
      });

      const childContentLevel1 = await orchestrator.createContent({
        owner_id: secondUser.id,
        parent_id: rootContent.id,
        title: 'Child content title Level 1',
        body: 'Child content body Level 1',
        status: 'published',
      });

      await orchestrator.updateContent(childContentLevel1.id, {
        status: 'deleted',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContentLevel1.slug}/parent`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O conteúdo informado não foi encontrado no sistema.',
        action: 'Verifique se os dados foram digitados corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:CONTENT:PARENT:GET_HANDLER:CONTENT_NOT_FOUND',
        key: 'slug',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('From "child" content 1 level deep with "published" status', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const rootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root content title',
        body: 'Root content body',
        status: 'published',
      });

      const childContentLevel1 = await orchestrator.createContent({
        owner_id: secondUser.id,
        parent_id: rootContent.id,
        title: 'Child content title Level 1',
        body: 'Child content body Level 1',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContentLevel1.slug}/parent`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: rootContent.id,
        parent_id: null,
        owner_id: firstUser.id,
        slug: 'root-content-title',
        title: 'Root content title',
        body: 'Root content body',
        children_deep_count: 1,
        status: 'published',
        source_url: null,
        published_at: rootContent.published_at.toISOString(),
        created_at: rootContent.created_at.toISOString(),
        updated_at: rootContent.updated_at.toISOString(),
        deleted_at: null,
        owner_username: firstUser.username,
        tabcoins: 1,
      });
    });

    test('From "child" content 3 level deep, with all "published"', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const rootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root content title',
        body: 'Root content body',
        status: 'published',
      });

      const childContentLevel1 = await orchestrator.createContent({
        owner_id: secondUser.id,
        parent_id: rootContent.id,
        title: 'Child content title Level 1',
        body: 'Child content body Level 1',
        status: 'published',
      });

      const childContentLevel2 = await orchestrator.createContent({
        owner_id: firstUser.id,
        parent_id: childContentLevel1.id,
        title: 'Child content title Level 2',
        body: 'Child content body Level 2',
        status: 'published',
      });

      const childContentLevel3 = await orchestrator.createContent({
        owner_id: secondUser.id,
        parent_id: childContentLevel2.id,
        title: 'Child content title Level 3',
        body: 'Child content body Level 3',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContentLevel3.slug}/parent`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: childContentLevel2.id,
        parent_id: childContentLevel1.id,
        owner_id: firstUser.id,
        slug: 'child-content-title-level-2',
        title: 'Child content title Level 2',
        body: 'Child content body Level 2',
        children_deep_count: 1,
        status: 'published',
        source_url: null,
        published_at: childContentLevel2.published_at.toISOString(),
        created_at: childContentLevel2.created_at.toISOString(),
        updated_at: childContentLevel2.updated_at.toISOString(),
        deleted_at: null,
        owner_username: firstUser.username,
        tabcoins: 1,
      });
    });

    test('From "child" content 3 level deep, but "parent" with "draft" status', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const rootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root content title',
        body: 'Root content body',
        status: 'published',
      });

      const childContentLevel1 = await orchestrator.createContent({
        owner_id: secondUser.id,
        parent_id: rootContent.id,
        title: 'Child content title Level 1',
        body: 'Child content body Level 1',
        status: 'published',
      });

      const childContentLevel2 = await orchestrator.createContent({
        owner_id: firstUser.id,
        parent_id: childContentLevel1.id,
        title: 'Child content title Level 2',
        body: 'Child content body Level 2',
      });

      const childContentLevel2Drafted = await orchestrator.updateContent(childContentLevel2.id, {
        status: 'draft',
      });

      const childContentLevel3 = await orchestrator.createContent({
        owner_id: secondUser.id,
        parent_id: childContentLevel2.id,
        title: 'Child content title Level 3',
        body: 'Child content body Level 3',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContentLevel3.slug}/parent`
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: childContentLevel2.id,
        parent_id: childContentLevel1.id,
        owner_id: firstUser.id,
        slug: 'nao-disponivel',
        title: '[Não disponível]',
        body: '[Não disponível]',
        children_deep_count: 0,
        status: 'draft',
        source_url: null,
        published_at: null,
        created_at: childContentLevel2.created_at.toISOString(),
        updated_at: childContentLevel2Drafted.updated_at.toISOString(),
        deleted_at: null,
        owner_username: firstUser.username,
        tabcoins: 0,
      });
    });

    test('From "child" content 3 level deep, but "parent" with "deleted" status', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const rootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root content title',
        body: 'Root content body',
        status: 'published',
      });

      const childContentLevel1 = await orchestrator.createContent({
        owner_id: secondUser.id,
        parent_id: rootContent.id,
        title: 'Child content title Level 1',
        body: 'Child content body Level 1',
        status: 'published',
      });

      const childContentLevel2 = await orchestrator.createContent({
        owner_id: firstUser.id,
        parent_id: childContentLevel1.id,
        title: 'Child content title Level 2',
        body: 'Child content body Level 2',
        status: 'published',
      });

      const childContentLevel2Deleted = await orchestrator.updateContent(childContentLevel2.id, {
        status: 'deleted',
      });

      const childContentLevel3 = await orchestrator.createContent({
        owner_id: secondUser.id,
        parent_id: childContentLevel2.id,
        title: 'Child content title Level 3',
        body: 'Child content body Level 3',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContentLevel3.slug}/parent`
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: childContentLevel2.id,
        parent_id: childContentLevel1.id,
        owner_id: firstUser.id,
        slug: 'nao-disponivel',
        title: '[Não disponível]',
        body: '[Não disponível]',
        children_deep_count: 0,
        status: 'deleted',
        source_url: null,
        published_at: childContentLevel2.published_at.toISOString(),
        created_at: childContentLevel2.created_at.toISOString(),
        updated_at: childContentLevel2Deleted.updated_at.toISOString(),
        deleted_at: childContentLevel2Deleted.deleted_at.toISOString(),
        owner_username: firstUser.username,
        tabcoins: 1,
      });
    });
  });
});
