import nunjucks from "nunjucks";

const configureNunjucks = (app) => {
  nunjucks.configure(["views"], {
    express: app,
    autoescape: true,
    noCache: true,
  });
};

export default configureNunjucks;
