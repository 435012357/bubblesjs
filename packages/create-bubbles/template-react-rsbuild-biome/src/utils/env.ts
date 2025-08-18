/**
 * 通过一个文件导出所有的环境变量这样方便统一修改
 * @returns
 */
export const envVariables = {
  PUBLIC_PORT: import.meta.env.PUBLIC_PORT,
  PUBLIC_PATH: import.meta.env.PUBLIC_PATH,
  PUBLIC_APP_NAME: import.meta.env.PUBLIC_APP_NAME,
  PUBLIC_API_AFFIX: import.meta.env.PUBLIC_API_AFFIX,
}
