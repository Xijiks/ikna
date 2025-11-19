import axios from "axios";
import config from "../config.json";
import Cookies from "js-cookie";

export default async function api(
  method,
  url,
  data = null,
  token = JSON.parse(Cookies.get("user-data") ?? "null")?.token
) {
  const result = await axios({
    method: method,
    url: url,
    baseURL: config.serverBaseUrl,
    data: data,
    headers: {
      common: {
        Authorization: `Bearer ${token}`,
      },
    },
  }).catch((error) => {
    console.log(error.code);
    return error;
  });
  if (result) {
    return result;
  }
  return null;
}
