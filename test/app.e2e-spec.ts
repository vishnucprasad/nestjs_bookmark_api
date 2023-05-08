import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    app.listen(3000);

    pactum.request.setBaseUrl('http://localhost:3000');

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'example@example.com',
      password: '123456789',
    };

    describe('Signup', () => {
      it('should throw an error if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: '123456789',
          })
          .expectStatus(400);
      });

      it('should throw an error if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            enail: 'example@example.com',
          })
          .expectStatus(400);
      });

      it('should throw an error if no body is provided', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('should throw an error if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: '123456789',
          })
          .expectStatus(400);
      });

      it('should throw an error if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            enail: 'example@example.com',
          })
          .expectStatus(400);
      });

      it('should throw an error if no body is provided', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });

      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should throw an error if no authorization bearer token is provided', () => {
        return pactum.spec().get('/users/me').expectStatus(401);
      });

      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withBearerToken('$S{userAt}')
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      it('should throw an error if no authorization bearer token is provided', () => {
        return pactum.spec().get('/users/me').expectStatus(401);
      });

      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'John',
          lastName: 'Doe',
        };

        return pactum
          .spec()
          .patch('/users')
          .withBearerToken('$S{userAt}')
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName);
      });
    });
  });

  describe('Bookmark', () => {
    describe('Get empty bookmarks', () => {
      it('should throw an error if no authorization bearer token is provided', () => {
        return pactum.spec().get('/bookmarks').expectStatus(401);
      });

      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'Github',
        link: 'https://github.com',
      };

      it('should throw an error if title is empty', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBearerToken('$S{userAt}')
          .withBody({
            link: 'https://github.com',
          })
          .expectStatus(400);
      });

      it('should throw an error if link is empty', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBearerToken('$S{userAt}')
          .withBody({
            title: 'Github',
          })
          .expectStatus(400);
      });

      it('should throw an error if no body is provided', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBearerToken('$S{userAt}')
          .expectStatus(400);
      });

      it('should throw an error if no authorization bearer token is provided', () => {
        return pactum.spec().post('/bookmarks').withBody(dto).expectStatus(401);
      });

      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBearerToken('$S{userAt}')
          .withBody(dto)
          .expectStatus(201)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.link)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get bookmarks', () => {
      it('should throw an error if no authorization bearer token is provided', () => {
        return pactum.spec().get('/bookmarks').expectStatus(401);
      });

      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark by id', () => {
      it('should throw an error if no authorization bearer token is provided', () => {
        return pactum.spec().get('/bookmarks').expectStatus(401);
      });

      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get(`/bookmarks/{id}`)
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Edit bookmark by id', () => {
      it('should throw an error if no authorization bearer token is provided', () => {
        return pactum.spec().get('/bookmarks').expectStatus(401);
      });

      it('should edit bookmark by id', () => {
        const dto: EditBookmarkDto = {
          description:
            'GitHub, Inc. is a provider of Internet hosting for software development and version control using Git',
        };
        return pactum
          .spec()
          .patch(`/bookmarks/{id}`)
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}')
          .expectBodyContains(dto.description);
      });
    });

    describe('Delete bookmark by id', () => {
      it('should throw an error if no authorization bearer token is provided', () => {
        return pactum.spec().get('/bookmarks').expectStatus(401);
      });

      it('should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete(`/bookmarks/{id}`)
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .expectStatus(204);
      });

      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
  });
});
