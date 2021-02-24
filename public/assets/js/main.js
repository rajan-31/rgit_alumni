!(function($) {
  "use strict";

  // Preloader
  $(window).on('load', function() {
    // $('#bodyContent').show();
    if ($('#preloader').length) {
      $('#preloader').delay(100).fadeOut('slow', function() {
        $(this).remove();
      });
    }
  });

  // Smooth scroll for the navigation menu and links with .scrollto classes
  var scrolltoOffset = $('#header').outerHeight() - 2;
  $(document).on('click', '.nav-menu a, .mobile-nav a, .scrollto', function(e) {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      if (target.length) {
        e.preventDefault();

        var scrollto = target.offset().top - scrolltoOffset;
        if ($(this).attr("href") == '#header') {
          scrollto = 0;
        }

        $('html, body').animate({
          scrollTop: scrollto
        }, 1500, 'easeInOutExpo');

        if ($(this).parents('.nav-menu, .mobile-nav').length) {
          $('.nav-menu .active, .mobile-nav .active').removeClass('active');
          $(this).closest('li').addClass('active');
        }

        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('fas fa-bars fas fa-times');
          $('.mobile-nav-overly').fadeOut();
        }
        return false;
      }
    }
  });

  // Activate smooth scroll on page load with hash links
  $(document).ready(function() {
    if (window.location.hash) {
      var initial_nav = window.location.hash;
      if ($(initial_nav).length) {
        var scrollto = $(initial_nav).offset().top - scrolltoOffset;
        $('html, body').animate({
          scrollTop: scrollto
        }, 1500, 'easeInOutExpo');
      }
    }

  });

  // Mobile Navigation
  if ($('.nav-menu').length) {
    var $mobile_nav = $('.nav-menu').clone().prop({
      class: 'mobile-nav d-lg-none'
    });
    $('body').append($mobile_nav);
    $('body').prepend('<button type="button" class="mobile-nav-toggle d-lg-none"><i class="fas fa-bars"></i></button>');
    $('body').append('<div class="mobile-nav-overly"></div>');

    $(document).on('click', '.mobile-nav-toggle', function(e) {
      $('body').toggleClass('mobile-nav-active');
      $('.mobile-nav-toggle i').toggleClass('fas fa-bars fas fa-times');
      $('.mobile-nav-overly').toggle();
    });

    $(document).on('click', '.mobile-nav .drop-down > a', function(e) {
      e.preventDefault();
      $(this).next().slideToggle(300);
      $(this).parent().toggleClass('active');
    });

    $(document).click(function(e) {
      var container = $(".mobile-nav, .mobile-nav-toggle");
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('fas fa-bars fas fa-times');
          $('.mobile-nav-overly').fadeOut();
        }
      }
    });
  } else if ($(".mobile-nav, .mobile-nav-toggle").length) {
    $(".mobile-nav, .mobile-nav-toggle").hide();
  }

  // Navigation active state on scroll
  var nav_sections = $('section');
  var main_nav = $('.nav-menu, #mobile-nav');

  $(window).on('scroll', function() {
    var cur_pos = $(this).scrollTop() + 200;

    nav_sections.each(function() {
      var top = $(this).offset().top,
        bottom = top + $(this).outerHeight();

      if (cur_pos >= top && cur_pos <= bottom) {
        if (cur_pos <= bottom) {
          main_nav.find('li').removeClass('active');
        }
        main_nav.find('a[href="#' + $(this).attr('id') + '"]').parent('li').addClass('active');
      }
      if (cur_pos < 300) {
        $(".nav-menu ul:first li:first").addClass('active');
      }
    });
  });

  // Toggle .header-scrolled class to #header when page is scrolled
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('#header').addClass('header-scrolled py-0');
      $('#main_logo').css({height:'60px'});
      // $('#main_logo').animate({height:'60px'}, 100);
    } else {
      $('#header').removeClass('header-scrolled py-0');
      $('#main_logo').css({height:'100px'});
      // $('#main_logo').animate({height:'100px'}, 100);
    }
  });

  if ($(window).scrollTop() > 100) {
    $('#header').addClass('header-scrolled py-0');
    $('#main_logo').css({height:'60px'});
    // $('#main_logo').animate({height:'60px'}, 100);
  }

  // Back to top button
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('.back-to-top').fadeIn('slow');
    } else {
      $('.back-to-top').fadeOut('slow');
    }
  });

  $('.back-to-top').click(function() {
    $('html, body').animate({
      scrollTop: 0
    }, 1500, 'easeInOutExpo');
    return false;
  });

  // Skills section
  $('.skills-content').waypoint(function() {
    $('.progress .progress-bar').each(function() {
      $(this).css("width", $(this).attr("aria-valuenow") + '%');
    });
  }, {
    offset: '80%'
  });

  // Porfolio isotope and filter
  $(window).on('load', function() {
  //   var portfolioIsotope = $('.portfolio-container').isotope({
  //     itemSelector: '.portfolio-item'
  //   });

  //   $('#portfolio-flters li').on('click', function() {
  //     $("#portfolio-flters li").removeClass('filter-active');
  //     $(this).addClass('filter-active');

  //     portfolioIsotope.isotope({
  //       filter: $(this).data('filter')
  //     });
  //     aos_init();
  //   });

    // Initiate venobox (lightbox feature used in portofilo)
    $(document).ready(function() {
      $('.venobox').venobox({
        'share': false
      });
    });
  });

  // Portfolio details carousel
  $(".portfolio-details-carousel").owlCarousel({
    autoplay: true,
    dots: true,
    loop: true,
    items: 1
  });

  // Init AOS
  function aos_init() {
    AOS.init({
      duration: 1000,
      once: true
    });
  }
  $(window).on('load', function() {
    aos_init();
  });

  // message length
  $(document).ready(function() {
    $("#word_count").on('keyup', function() {      
      if ( this.value.length > 1000){
        var trimmed = $(this).val().slice(0, 1000);
        $(this).val(trimmed + " ");
      } else if ( this.value.match(/\S+/g).length > 100) {
        // Split the string on first 200 words and rejoin on spaces
        var trimmed = $(this).val().split(/\s+/, 100).join(" ");
        // Add a space at the end to make sure more typing creates new words
        $(this).val(trimmed + " ");
      }

    });
  });
  /*--------------------------------------------------------------------------------------- */

  $('#workModalButton').click(function(){
    let employer = $('#workModalData-employer').val(), 
        jobTitle = $('#workModalData-jobTitle').val(), 
        jobDomain = $('#workModalData-jobDomain').val(), 
        jobFrom = $('#workModalData-jobFrom').val(), 
        jobTill = $('#workModalData-jobTill').val();

    if (employer && jobTitle && jobDomain && jobFrom){

        $('#addedWork').append(
            `
            <div class="section-bg my-3 px-2 py-2 rounded border border-dark">
            <p>&nbsp;
              <button type="button" class="removeWork close" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
              </button>
            </p>
                <div class="row">
                <div class="form-group col-4">
                    <label for="employer">Employer</label>
                    <input type="text" name="profile[workExperience][employer]" class="form-control" value="${employer}" required="required">
                </div>
                <div class="form-group col-4">
                    <label for="jobTitle">Title</label>
                    <input type="text" name="profile[workExperience][jobTitle]" class="form-control" value="${jobTitle}" required="required">
                </div>
            
                <div class="form-group col-4">
                    <label for="jobDomain">Domain</label>
                        <input type="text" name="profile[workExperience][jobDomain]" class="form-control" value="${jobDomain}" required="required">
                </div>
                                
                <div class="form-group col-6">
                    <label for="jobFrom">job From</label>
                    <input type="date" name="profile[workExperience][jobFrom]" class="form-control" value="${jobFrom}" required="required">
                </div>
            
                <div class="form-group col-6">
                    <label for="jobTill">Job Till</label>
                    <input type="date" name="profile[workExperience][jobTill]" class="form-control" value="${jobTill}">
                </div>
                </div>
            </div>
            `);
            $('#workModalData-employer').val('')
            $('#workModalData-jobTitle').val('')
            $('#workModalData-jobDomain').val('')
            $('#workModalData-jobFrom').val('')
            $('#workModalData-jobTill').val('')
        $(this).attr('data-dismiss', 'modal')
      }
  });

  $('.removeWork').click(function () {
        $(this).closest('div').remove();
  });

})(jQuery);