function isScrolledIntoView(a) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height() - 100;
    var elemTop = a.offset().top;
    var elemBottom = elemTop + a.outerHeight();
    if (elemBottom > docViewTop && elemTop < docViewBottom) {
        a.addClass("active");
    }else{
        a.removeClass("active")
    }
};


$(document).ready(function(){

    $(window).on("resize scroll", function () {
        $(".result__list__item").each(function () {
            isScrolledIntoView($(this));
        });
    });

    $(".top__bottom__btn").on("click", () => {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: $(window).height()
        }, 1500);
    });

    $(".footer__top__btn").on("click", () => {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: 0
        }, 1500);
    });

});