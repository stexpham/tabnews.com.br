const { join, resolve } = require('path');
import { renderToStaticMarkup } from 'react-dom/server';
import { renderAsync } from '@resvg/resvg-js';
import getConfig from 'next/config';
import nextConnect from 'next-connect';
import { renderTemplate } from './_lib/template';
import { parseContent } from './_lib/parser';
import controller from 'models/controller';
import authentication from 'models/authentication';
import validator from 'models/validator.js';
import content from 'models/content.js';
import { NotFoundError } from 'errors/index.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
    slug: 'required',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const contentFound = await content.findOne({
    where: {
      username: request.query.username,
      slug: request.query.slug,
      status: 'published',
    },
  });

  if (!contentFound) {
    throw new NotFoundError({
      message: `Este conteúdo não está disponível.`,
      action: 'Verifique se o "slug" está digitado corretamente ou considere o fato do conteúdo ter sido despublicado.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:CONTENT:THUMBNAIL:GET_HANDLER:SLUG_NOT_FOUND',
      key: 'slug',
    });
  }

  const parsedContent = parseContent(contentFound);
  const svg = renderToStaticMarkup(renderTemplate(parsedContent));

  const result = await renderAsync(svg, {
    fitTo: {
      mode: 'width',
      value: 1280,
    },
    font: {
      fontFiles: [
        join(resolve('.'), 'fonts', 'Roboto-Regular.ttf'),
        join(resolve('.'), 'fonts', 'Roboto-Bold.ttf'),
        join(resolve('.'), 'fonts', 'NotoEmoji-Bold.ttf'),
      ],
      loadSystemFonts: false,
      defaultFontFamily: 'Roboto',
    },
  });

  response.statusCode = 200;
  response.setHeader('Content-Type', `image/png`);
  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  response.end(result.asPng());
}
