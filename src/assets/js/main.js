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

  // Porfolio isotope and filter
  $(window).on('load', function() {
    // Initiate venobox (lightbox feature used in portofilo)
    $(document).ready(function() {
      $('.venobox').venobox({
        'share': false
      });
    });
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

    if (window.location.hash) {
      var initial_nav = window.location.hash;
      if ($(initial_nav).length) {
        var scrollto = $(initial_nav).offset().top - scrolltoOffset;
        $('html, body').animate({
          scrollTop: scrollto
        }, 1500, 'easeInOutExpo');
      }
    }

    // Mobile Navigation
    if ($('.nav-menu').length) {
      var $mobile_nav = $('.nav-menu').clone().prop({
        class: 'mobile-nav d-lg-none'
      });
      $('body').append($mobile_nav);
      $('body').prepend('<button type="button" class="mobile-nav-toggle d-lg-none"><i class="fas fa-bars"></i></button>');
      $('body').append('<div class="mobile-nav-overly"></div>');

      $(document).on('click', '.mobile-nav-toggle', function() {
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
      $('#main_logo').css({height:'60px', "padding-top": "4px"});
      // $('#main_logo').animate({height:'60px'}, 100);
    } else {
      $('#header').removeClass('header-scrolled py-0');
      $('#main_logo').css({height:'100px', "padding-top": "0"});
      // $('#main_logo').animate({height:'100px'}, 100);
    }
  });

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

    // Portfolio details carousel
    $(".portfolio-details-carousel").owlCarousel({
      // autoplay: true,
      dots: true,
      loop: true,
      items: 1,
      center: true,
      // lazyLoad: true,
      margin: 10,
      infinite: false
    });


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


    /*--------------------------------------------------------------------------------------- */
  
    $('#workModalButton').click(function(){
      let employer = $('#workModalData-employer').val(), 
          jobTitle = $('#workModalData-jobTitle').val(), 
          jobDomain = $('#workModalData-jobDomain').val(), 
          jobFrom = $('#workModalData-jobFrom').val(), 
          jobTill = $('#workModalData-jobTill').val();
  
          // console.log(jobFrom)
          // console.log(jobTill)
  
      if (employer && jobTitle && jobDomain && jobFrom){
        let present_job = `<div class="form-group col-sm-12 col-md-6">
                              <label >Till</label>
                              <input type="text" name="profile[workExperience][jobTill]" class="form-control" value="Present" readonly="readonly" autocomplete="off">
                          </div>`;
        if (jobTill) {
          present_job = `<div class="form-group col-sm-12 col-md-6">
                            <label for="jobTill">Till</label>
                            <input type="text" name="profile[workExperience][jobTill]" class="form-control month-picker" value="${jobTill}" autocomplete="off">
                        </div>`
        }
        
          $('#addedWork').append(
              `
              <div class="section-bg my-3 px-2 py-2 rounded border border-dark">
              <p>&nbsp;
                <button type="button" class="removeWork close" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
              </p>
                  <div class="row">
                  <div class="form-group col-md-12 col-lg-4">
                      <label for="employer">Employer</label>
                      <input type="text" name="profile[workExperience][employer]" class="form-control" value="${employer}" required="required">
                  </div>
                  <div class="form-group col-md-12 col-lg-4">
                      <label for="jobTitle">Title/Post</label>
                      <input type="text" name="profile[workExperience][jobTitle]" class="form-control" value="${jobTitle}" required="required">
                  </div>
              
                  <div class="form-group col-md-12 col-lg-4">
                      <label for="jobDomain">Domain</label>
                          <input type="text" name="profile[workExperience][jobDomain]" class="form-control" value="${jobDomain}" required="required">
                  </div>
                                  
                  <div class="form-group col-sm-12 col-md-6">
                      <label for="jobFrom">From</label>
                      <input type="text" name="profile[workExperience][jobFrom]" class="form-control month-picker" value="${jobFrom}" required="required">
                  </div>
                  
                  ${present_job}
                  
                  </div>
              </div>
              `);
              $('#workModalData-employer').val('')
              $('#workModalData-jobTitle').val('')
              $('#workModalData-jobDomain').val('')
              $('#workModalData-jobFrom').val('')
              $('#workModalData-jobTill').val('')
              $('.removeWork').click(function () {
                $(this).closest('div').remove();
              });
          $(this).attr('data-dismiss', 'modal')
        }
    });
  
    $('.removeWork').click(function () {
          $(this).closest('div').remove();
    });
  
    /* Testimonials */
    $(".testimonials-slider").owlCarousel({
      autoplay: true,
      dots: true,
      loop: true,
      margin:10,
      infinite: false,
      smartSpeed: 700,
      // autoWidth:true,
      // center: true,
      items: 1
      // responsive: {
      //   0: {
      //     items: 1
      //   },
      //   1000: {
      //     items: 2
      //   }
      // }
    });

    /* suucess n err message */
    $(".toast").toast('show');
  
    /* newsletter form */
    $("#newsletter-form").on("submit", function(e) {
      e.preventDefault();
      
      $(".newsletter-invalid-email, .newsletter-request-failed, .newsletter-email-exists").hide();
      var $submit_btn = $("#newsletter-submit-btn");
      var submit_btn_width = $submit_btn.width()-16;
      $submit_btn.html(`<span id="spinner" class="spinner-border spinner-border-sm" style="vertical-align: middle; margin-left: ${submit_btn_width/2}px; margin-right: ${submit_btn_width/2}px" role="status" aria-hidden="true"></span>`)
  
  
      const email = $("#newsletter-email").val()
  
      $.ajax({
        url: "/newsletter",
        method: "POST",
        data: { email:  email },
        
      }).done(function(response) {
        $submit_btn.html("Subscribe");
        if(response == "Done") {
          $submit_btn
            .html("Subscribed")
            .css("background", "#28a761")
            .prop('disabled', true);
        } else if(response == "Invalid") {
          $(".newsletter-invalid-email").show(600);
        } else if(response == "Failed") {
          $(".newsletter-request-failed").show(600);
        } else if(response == "Exists") {
          $(".newsletter-email-exists").show(600);
          $submit_btn
            .html("Subscribed")
            .css("background", "#28a761")
            .prop('disabled', true);
        }
      });
  
    });

    /* user search form */
    function give_user_template(data) {
      const top = '<div class="col-xl-4 col-md-6 d-flex align-items-stretch mb-3" data-aos="zoom-in" data-aos-delay="100"> <div class="icon-box keep-width d-flex flex-column">';

      const bottom = '</div> </div>';

      let image;
      if (data.profileImage) {
        image = `
                <img src="/assets/img/user-placeholder-200x200.gif" class="lazyload mx-auto" data-src="${data.profileImage}" alt="Image Not Found" width="200" height="200" onerror="this.onerror=null;this.src='/assets/img/user-placeholder-200x200.gif';">
                `
      } else[
        image = '<div class="text-center"> <i class="fas fa-user" style="font-size: 200px;"></i> </div>'
      ]

      let name = `
              <div class="text-center">
                  <hr>
                  <h4><a href="/profile/${data._id} ">${data.firstName} ${data.lastName}</a></h4>
              </div>
              <br>
              `

      let bio;
      if (data.profile && data.profile.bio.length > 213) {
        bio = `<div class="flex-grow-1"><p>${data.profile.bio.slice(0, 210) + "..."}</p></div><div><hr></div><br>`
      } else {
        bio = `<div class="flex-grow-1"><p>${data.profile.bio}</p></div><div><hr></div><br>`
      }

      const info = `
              <div class="row text-center">
                  <div class="col-6"><h4><a href="/profile/${data._id}"><i class="fas fa-id-card pr-1"></i>Profile</a></h4></div>
                  <div class="col-6"><h4><a href="/chats/${data._id}"><i class="fas fa-paper-plane pr-1"></i>Chat</a></h4></div>
              </div>
              `
      const user_template = top + image + name + bio + info + bottom;

      return user_template;
    }

    /* communicate page search */
    $("#search-form").on("submit", function(e) {
      e.preventDefault();
      
      const q = $("#search-query").val();

      if(q && q.length>0) {
        $.ajax({
          url: "/communicate/search",
          method: "GET",
          data: { q:  q },
          
        }).done(function(res) {
          $("#hide-users").hide();

          if(res == "Failed") {
            $("#search-users-result").html('<div class="text-center font-weight-bold text-dark mx-auto">Search Failed</div>');
          } else if(res == "Invalid") {
            $("#search-users-result").html('<div class="text-center font-weight-bold text-dark mx-auto">Invalid search</div>');
          } else if(res == "None") {
            $("#search-users-result").html('<div class="text-center font-weight-bold text-dark mx-auto">No Users Found</div>');
          } else {
            $("#search-users-result").html("");

            const n = res.length;
            for(let i=0; i<n; i++) {
              $("#search-users-result").append(give_user_template(res[i]));
            }

          }
        });
      }

    });
    
    $("#search-reset-btn").on("click", function() {
      $("#hide-users").show();
      $("#search-users-result").html("");
    });

    $("#search-query").on("keyup", function() {
      const $this = $(this);
      const $value = $this.val();
      if($value.length == 0) {
        $("#hide-users").show();
      }
    });

    /* communicate page chat link */
    $(".chat-link").on("click", function() {
      const $this = $(this);
      $("#chat-with").text($this.attr("data-name"));
      $("#chat-link").attr("href", $this.attr("data-href"));

      $("#chat-modal").modal('show');
    });
    
    // write above this
  });

})(jQuery);