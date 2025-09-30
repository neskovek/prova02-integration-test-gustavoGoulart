import pactum from 'pactum';
import { faker } from '@faker-js/faker';
import { StatusCodes } from 'http-status-codes';

describe('ReqRes API', () => {
    const apiKey = 'reqres-free-v1';
    const baseUrl = 'https://reqres.in/api';
    const p = pactum;
   
    p.request.setDefaultTimeout(30000);
    p.request.setDefaultHeaders({
        'x-api-key': apiKey
    });
   
    let userId;
    let userToken;
    let createdUserId;

    describe('Cadastrar usuários', () => {
        it('Deve criar um novo usuário com sucesso', async () => {
            const requestBody = {
                email: "eve.holt@reqres.in",
                password: faker.internet.password({ length: 10, prefix: 'Aa@1' })
            };
           
            const response = await p
                .spec()
                .post(`${baseUrl}/register`)
                .withJson(requestBody)
                .expectStatus(StatusCodes.OK)
                .expectJsonLike({
                    id: 4,
                    token: /.+/
                });
           
            userId = response.json.id;
            userToken = response.json.token;
        });

        it('Deve buscar o usuário criado por ID', async () => {
            await p
                .spec()
                .get(`${baseUrl}/users/${userId}`)
                .expectStatus(StatusCodes.OK)
                .expectJsonLike({
                    data: {
                        id: userId
                    }
                })
                .expectJsonSchema({
                    type: 'object',
                    properties: {
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'number' },
                                email: { type: 'string' },
                                first_name: { type: 'string' },
                                last_name: { type: 'string' },
                                avatar: { type: 'string' }
                            }
                        }
                    }
                });
        });

        it('Deve retornar erro ao tentar registrar sem a senha', async () => {
            const requestBody = {
                email: "eve.holt@reqres.in"
            };
           
            await p
                .spec()
                .post(`${baseUrl}/register`)
                .withJson({
                    email: requestBody.email
                })
                .expectStatus(StatusCodes.BAD_REQUEST)
                .expectJsonLike({
                    error: "Missing password"
                });
        });

        it('Deve retornar erro ao buscar usuário inexistente', async () => {
            await p
                .spec()
                .get(`${baseUrl}/users/${4841}`)
                .expectStatus(StatusCodes.NOT_FOUND);
        });
    });

    describe('Gerenciar usuários', () => {
        it('Deve atualizar um usuário com PUT', async () => {
            const updateData = {
                name: faker.person.fullName(),
                job: faker.person.jobTitle()
            };

            const response = await p
                .spec()
                .put(`${baseUrl}/users/2`)
                .withJson(updateData)
                .expectStatus(StatusCodes.OK)
                .expectJsonLike({
                    name: updateData.name,
                    job: updateData.job,
                    updatedAt: /.+/
                });
        });

        it('Deve atualizar parcialmente um usuário com PATCH', async () => {
            const patchData = {
                job: faker.person.jobTitle()
            };

            await p
                .spec()
                .patch(`${baseUrl}/users/2`)
                .withJson(patchData)
                .expectStatus(StatusCodes.OK)
                .expectJsonLike({
                    job: patchData.job,
                    updatedAt: /.+/
                });
        });

        it('Deve deletar um usuário com sucesso', async () => {
            await p
                .spec()
                .delete(`${baseUrl}/users/2`)
                .expectStatus(StatusCodes.NO_CONTENT);
        });
    });

    describe('Listar recursos', () => {
        it('Deve listar usuários com paginação', async () => {
            await p
                .spec()
                .get(`${baseUrl}/users`)
                .withQueryParams({ page: 2 })
                .expectStatus(StatusCodes.OK)
                .expectJsonSchema({
                    type: 'object',
                    required: ['page', 'per_page', 'total', 'total_pages', 'data'],
                    properties: {
                        page: { type: 'number' },
                        per_page: { type: 'number' },
                        total: { type: 'number' },
                        total_pages: { type: 'number' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'number' },
                                    email: { type: 'string' },
                                    first_name: { type: 'string' },
                                    last_name: { type: 'string' },
                                    avatar: { type: 'string' }
                                }
                            }
                        }
                    }
                })
                .expectJsonLike({
                    page: 2
                });
        });

        it('Deve listar recursos (resources) com sucesso', async () => {
            await p
                .spec()
                .get(`${baseUrl}/unknown`)
                .expectStatus(StatusCodes.OK)
                .expectJsonSchema({
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'number' },
                                    name: { type: 'string' },
                                    year: { type: 'number' },
                                    color: { type: 'string' },
                                    pantone_value: { type: 'string' }
                                }
                            }
                        }
                    }
                });
        });

        it('Deve buscar um recurso específico por ID', async () => {
            await p
                .spec()
                .get(`${baseUrl}/unknown/2`)
                .expectStatus(StatusCodes.OK)
                .expectJsonLike({
                    data: {
                        id: 2
                    }
                })
                .expectJsonSchema({
                    type: 'object',
                    properties: {
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'number' },
                                name: { type: 'string' },
                                year: { type: 'number' },
                                color: { type: 'string' },
                                pantone_value: { type: 'string' }
                            }
                        }
                    }
                });
        });
    });

    describe('Delayed Response', () => {
        it('Deve lidar com resposta atrasada', async () => {
            const startTime = Date.now();

            await p
                .spec()
                .get(`${baseUrl}/users`)
                .withQueryParams({ delay: 3 })
                .expectStatus(StatusCodes.OK)
                .expectJsonSchema({
                    type: 'object',
                    properties: {
                        data: { type: 'array' }
                    }
                });

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).toBeGreaterThanOrEqual(3000);
        });
    });
});
