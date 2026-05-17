class ErrorUtil {

  async createErrorContent(errorContent: string, title: string, message: string) {
    errorContent = errorContent
      .replace(/{{TITLE}}/g, title)
      .replace(/{{MESSAGE}}/g, message);

    return errorContent;
  }
}

export default new ErrorUtil();
