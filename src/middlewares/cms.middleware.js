import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { envConfig } from "../../config/env.js";

const nunjucksFilter = async (req, res, next) => {
  // Stringify the JSON object
  res.locals.jsonToString = (json, replacer = null, indentation = 0) => {
    if (json) {
      return JSON.stringify(json, replacer, indentation);
    } else {
      return JSON.stringify({});
    }
  };

  // Object keys
  res.locals.ObjectKeys = (object) => {
    return Object.keys(object);
  };

  res.locals.currentYear = new Date().getFullYear();

  res.locals.formatDate = (date, dateFormat = "dd-MM-yyyy") => {
    try {
      if (date && dateFormat) return format(date, dateFormat);
      return null;
    } catch (error) {
      logError(error);
      return null;
    }
  };

  res.locals.formatDateInTimezone = (
    date,
    timezone = "Asia/Dubai",
    dateFormat = "dd-MM-yyyy"
  ) => {
    try {
      if (date) return formatInTimeZone(date, timezone, dateFormat);
      return null;
    } catch (error) {
      logError(error);
      return null;
    }
  };

  res.locals.formatDateTimeInTimezone = (
    date,
    timezone = "Asia/Dubai",
    dateFormat = "dd-MM-yyyy HH:ii:ss",
    convert = false
  ) => {
    try {
      if (date && convert) date = new Date(date);
      if (date) return formatInTimeZone(date, timezone, dateFormat);
      return null;
    } catch (error) {
      logError(error);
      return null;
    }
  };

  res.locals.toLocaleString = (string) => {
    try {
      if (string) return string.toLocaleString();
      return string;
    } catch (error) {
      logError(error);
      return string;
    }
  };

  res.locals.toFixed = (value = 0, digit = 2) => {
    try {
      if (Number(value)) return Number(value).toFixed(digit);
      return value;
    } catch (error) {
      logError(error);
      return 0.0;
    }
  };

  res.locals.numberFormat = (
    number,
    decimals = 0,
    dec_point = ".",
    thousands_sep = ","
  ) => {
    try {
      number = (number + "").replace(/[^0-9+\-Ee.]/g, "");
      const n = !isFinite(+number) ? 0 : +number;
      const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
      const sep = typeof thousands_sep === "undefined" ? "," : thousands_sep;
      const dec = typeof dec_point === "undefined" ? "." : dec_point;
      let s = "";

      const toFixedFix = function (n, prec) {
        const k = Math.pow(10, prec);
        return "" + (Math.round(n * k) / k).toFixed(prec);
      };

      s = (prec ? toFixedFix(n, prec) : "" + Math.round(n)).split(".");
      if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
      }

      if ((s[1] || "").length < prec) {
        s[1] = s[1] || "";
        s[1] += new Array(prec - s[1].length + 1).join("0");
      } else if (prec === 0) {
        s.length = 1; // Remove the decimal part if decimals is 0
      }

      return s.join(dec);
    } catch (error) {
      logError(`Error in numberFormat filter for value: ${number}`);
      return String(number);
    }
  };

  next();
};

const baseConfig = async (req, res, next) => {
  let activeNav;
  if (req.url.startsWith("/assets")) {
    activeNav = "/admin/dashboard";
  } else {
    activeNav = req.originalUrl;
    if (req.originalUrl.includes("?")) {
      activeNav = req.originalUrl.split("?")?.[0];
    }
  }
  res.locals.activeNav = activeNav;
  res.locals.clientName = envConfig.general.CLIENT_NAME;
  res.locals.cmsLogo = envConfig.general.CMS_LOGO;
  res.locals.cmsLogoMobile = envConfig.general.CMS_LOGO_MOBILE;

  res.locals.frontEndUrl = req.authUser?.selectedCountry?.frontend_url;

  // res.locals.selectedCountry = req.session.selectedCountry || {};
  res.locals.authAdmin = req.session.authAdmin;

  next();
};

export { nunjucksFilter, baseConfig };
