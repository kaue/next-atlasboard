Widgets.twitter = {

  onData: function(el,data) {
    if (data.title) {
      $('h2', el).text(data.title);
    }

    $('.content', el).empty();

    if (data.feed){
      for (var i = 0, l = data.feed.length; i < l ;  i++) {
        $('.content', el).append(
          "<blockquote>" + data.feed[i].text + "<cite>" + data.feed[i].from_user_name + "</cite></blockquote>"
        );
      }
    }
  }
};