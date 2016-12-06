class WikiApi {
  queryTopic(topic, callback, error) {
    const PROPS = {
      exsentences: 3,
      action: 'query',
      prop: 'extracts',
      explaintext: 1,
      exintro: 1,
      format: 'json',
      redirects: 1
    };
    const ENDPOINT = '/w/api.php';
    jQuery.get(
      ENDPOINT,
      jQuery.extend(PROPS, {titles: topic}),
      response => this.getContent(response, callback, error)
    );
  }
  getContent(response, callback, error) {
    if (!callback)
      return;

    try {
      let pages = response.query.pages;
      for (var pageid in pages) {
        try {
          const val = pages[pageid].extract;
          if (val) {
            callback(val);
            return;
          }
        } catch(e) {}
      }
    } catch(e) {}
    if (error)
      error({reason: 'unable to parse response', response: response});
  }
}

function parseTopicFromUrl(url) {
  const REGEX = /\/wiki\/(.*)/;
  const match = REGEX.exec(url);
  if (match)
    return unescape(match[1]);
}
