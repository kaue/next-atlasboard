Widgets.calendar = {
    onData: function (el, data) {
        $('.content', el).empty();

        if (data.title) {
            $('h2', el).text(data.title);
        }

        if (!data.events || !data.events.length) {
            $('.content', el).append($("<div>").html("No events found."));
        } else {
            data.events.forEach(function (event) {
                var eventDiv = $("<div/>").addClass('leave-event');
                $(eventDiv).append($("<div/>").addClass('leave-dates').append(event.startDate + " - " + event.endDate));
                $(eventDiv).append($("<div/>").addClass('leave-summary').append(event.summary));

                $('.content', el).append(eventDiv);
            });
        }
    }
};