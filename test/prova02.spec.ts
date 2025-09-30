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
});