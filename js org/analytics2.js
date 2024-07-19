// Description: This is the analytics class for the playble ads. It is responsible for collecting and sending analytics data to the backend.
// Object passed to the constructor with types: {campaignID: str, companyID: str, cta_setup: str, clickUrl: str, pages: obj[arr], adContainer: domEl, live: bool, startPage: {"introduction" || "game-view" || "outcome"}}
//cta_setup should be object with name, id and url of the cta
function Analytics({ campaignID, companyID, cta_setup, language, pages, adContainer, live, startPage }) {
  let useDebug = true;
  let frontOnlyMode = true;
  let collectAnalytics = false;
  if (live) {
    useDebug = false;
    frontOnlyMode = false;
    collectAnalytics = true;
  }
  const url_base = "https://1tik9uyed8.execute-api.eu-central-1.amazonaws.com/";
  // const url_base = "http://localhost:3000/";
  const saas_url_base = "https://api.brame-gamification.com/";
  const analytics_collector = "analytics-collector.brame-gamification.com";

  let visitorID = null;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  // Advanced analytics variables
  let secondsVisible = 0,
    secondsInteractive = 0,
    dwellTime = 0,
    reportedInteracted = false,
    reportedVisible = false,
    reportedHovered = false,
    hovered = false,
    reportHoveredDone = false;
  let intervalStarted = true,
    isVisible = false,
    isInteractive = false;
  let lastSecondsVisible = 0,
    lastSecondsInteractive = 0,
    lastDwellTime = 0;
  let isEngaging = false,
    engagementReported = false;
  // Impression variables
  let impressions501 = false;
  let impressions502 = false;
  let impressions503 = false;
  let impressions1001 = false;
  let impressions1003 = false;

  let options = {
    root: null,
    rootMargin: "0px",
    threshold: 0.5,
  };

  let options_100 = {
    root: null,
    rootMargin: "0px",
    threshold: 1.0,
  };

  let commonPayload = {
    user_id: visitorID,
    company_id: companyID,
    campaign_id: campaignID,
    lang_id: language,
  };

  let tag = "";

  function sendAnalyticsEvent(eventName, data) {
    if (!collectAnalytics || frontOnlyMode) return;

    if (useDebug) console.log("Track event: " + eventName);

    snowplow("trackSelfDescribingEvent", {
      schema: "iglu:com.brame/brame_tracker_event/jsonschema/1-0-0",
      data: {
        event_type: eventName,
        ...commonPayload,
        ...data,
      },
    });
  }

  cta_setup.forEach((cta) => {
    document.getElementById(cta.name).addEventListener("click", (e) => {
      e.stopPropagation();
      if (useDebug) console.log("clicked");
      setupCTA(cta.id, cta.url, cta.clickTagUrl, cta.target, cta.openLink);
    });
  });

  function setupCTA(ctaId, url, clickTagUrl, target, openLink = true) {
    if (frontOnlyMode || !ctaId) window.open(url, target);
    else {
      $.ajax({
        url: url_base + "cta_link",
        type: "GET",
        data: "campaign_id=" + campaignID + "&campaign_tag=" + tag + "&cta_id=" + ctaId + "&language=" + language,
        dataType: "json",
      })
        .done(function (data) {
          if (useDebug) console.log(data);
        })
        .fail(function (data) {
          if (useDebug) console.log(data);
        });
      //window.open(clickUrl,target);
      if(!openLink) return;
      if (clickTagUrl != undefined && clickTagUrl.length > 0) window.open(url + "?" + clickTagUrl, target);
      else window.open(url, target);
      //window.open(url_base + "cta_link" + "?campaign_id=" + campaignID + "&campaign_tag=" + tag + "&cta_id=" + cta_setup + "&language=" + language, target);
    }
  }

  function setCTAURL(cta) {
    if (useDebug) {
      console.log("ad loaded");
    }
    //reportAdvancedAnalytics(0);
    if (cta.clickTagUrl == null || cta.clickTagUrl == "") {
      cta.clickTagUrl = document.querySelector(cta.tag).href;
      if (cta.clickTagUrl != null && cta.clickTagUrl.endsWith(cta.tag)) cta.clickTagUrl = "";
      else if (cta.clickTagUrl != null) {
        cta.url = cta.clickTagUrl;
        cta.clickTagUrl = "";
      }
    }
  }

  $(document).ready(function () {
    cta_setup.forEach((cta) => {
      setCTAURL(cta);
    });
    tag = document.body.scrollWidth + "x" + document.body.scrollHeight;
    if (useDebug) console.log(tag);
    commonPayload.tag = tag;

    if (!frontOnlyMode) {
      const fpPromise = import("../js/fp.js").then((FingerprintJS) => FingerprintJS.load());
      fpPromise
        .then((fp) => fp.get())
        .then((result) => {
          visitorID = result.visitorId;
          if (useDebug) console.log("VISITOR ID: " + visitorID);

          if (collectAnalytics) {
            commonPayload.user_id = visitorID;
            commonPayload.language = language;

            if (useDebug) console.log("registering analytics service");

            (function (p, l, o, w, i, n, g) {
              if (!p[i]) {
                p.GlobalSnowplowNamespace = p.GlobalSnowplowNamespace || [];
                p.GlobalSnowplowNamespace.push(i);
                p[i] = function () {
                  (p[i].q = p[i].q || []).push(arguments);
                };
                p[i].q = p[i].q || [];
                n = l.createElement(o);
                g = l.getElementsByTagName(o)[0];
                n.async = 1;
                n.src = w;
                g.parentNode.insertBefore(n, g);
              }
            })(window, document, "script", "./js/snowplow.ad.min.js", "snowplow");
            snowplow("newTracker", "snowplow", analytics_collector, {
              appId: "brame-app",
              platform: "web",
              discoverRootDomain: true,
              stateStorageStrategy: "localStorage",
              contexts: {
                webPage: true,
                geolocation: false,
              },
            });
            snowplow("enableActivityTracking", 5, 5);
            snowplow("trackPageView", null, [
              {
                schema: "iglu:com.brame/brame_tracker_event/jsonschema/1-0-0",
                data: {
                  ...commonPayload,
                },
              },
            ]);

            /*sendAnalyticsEvent('page-view', { "page_title": "game-view" });
                      sendAnalyticsEvent('ad-view', { "impression" : true});*/
          }

          $.ajax({
            url: saas_url_base + "play/play-id?campaignId=" + campaignID + "&visitorId=" + visitorID + "&status=LEAD_REGISTERED",
            type: "get",
            dataType: "json",
            contentType: "application/json",
            success: function (data) {
              if (useDebug) console.log(data);

              $.ajax({
                url: saas_url_base + "play/",
                type: "post",
                contentType: "application/json",
                success: function (data) {
                  if (useDebug) console.log(data);

                  play_id = data.playId;
                },
                error: function (response) {
                  if (useDebug) console.log("There was an issue connecting to our server: " + response.responseText);
                },
                data: JSON.stringify({
                  campaignId: campaignID,
                  visitorId: visitorID,
                  language: language,
                }),
              });
            },
            error: function (response) {
              if (useDebug) console.log("There was an issue connecting to our server: " + response.responseText);
            },
          });

          startAdvancedTracking();
        });
    }
  });

  // Define visibility constants
  const VISIBILITY_50 = "50%";
  const VISIBILITY_100 = "100%";

  // Initialize visibility start times and durations
  let visibilityStartTimes = { [VISIBILITY_50]: 0, [VISIBILITY_100]: 0 };
  let visibilityDurations = { [VISIBILITY_50]: 0, [VISIBILITY_100]: 0 };

  // Function to check impressions
  function impressionCheck(visibilityDuration, impression, seconds) {
    if (visibilityDuration > seconds && !impression) {
      return true;
    }
    return impression;
  }

  // Function to handle intersection
  function handleIntersectImpressions(entries, visibility) {
    let visible = entries[0].isIntersecting;

    impressions501 = impressionCheck(visibilityDurations[VISIBILITY_50], impressions501, 1000);
    impressions502 = impressionCheck(visibilityDurations[VISIBILITY_50], impressions502, 2000);
    impressions503 = impressionCheck(visibilityDurations[VISIBILITY_50], impressions503, 3000);
    impressions1001 = impressionCheck(visibilityDurations[VISIBILITY_100], impressions1001, 1000);
    impressions1003 = impressionCheck(visibilityDurations[VISIBILITY_100], impressions1003, 3000);

    // Handle visibility changes
    if (visible) {
      handleVisibilityStart(visibility);
    } else {
      handleVisibilityEnd(visibility);
    }
  }

  let observer = new IntersectionObserver(handleIntersect, options);

  function handleIntersect(entries, observer) {
    isVisible = entries[0].isIntersecting;
    if (!isVisible) {
      isInteractive = false;
    }
  }
  observer.observe(adContainer);

  // Function to handle visibility start
  function handleVisibilityStart(visibility) {
    if (visibilityStartTimes[visibility] === 0) {
      visibilityStartTimes[visibility] = Date.now();
    }
  }

  // Function to handle visibility end
  function handleVisibilityEnd(visibility) {
    if (visibilityStartTimes[visibility] !== 0) {
      let duration = Date.now() - visibilityStartTimes[visibility];
      visibilityDurations[visibility] += duration;
      visibilityStartTimes[visibility] = 0;
    }
  }

  // Create and observe with IntersectionObservers
  let observer_50 = new IntersectionObserver((entries) => handleIntersectImpressions(entries, VISIBILITY_50), options);
  let observer_100 = new IntersectionObserver((entries) => handleIntersectImpressions(entries, VISIBILITY_100), options_100);

  observer_50.observe(adContainer);
  observer_100.observe(adContainer);

  function updateTime() {
    dwellTime++;
    // Check if all impressions are registered
    adImpressions();
    if (!engagementReported) {
      if (isVisible) {
        secondsVisible++;
        if (useDebug) console.log(isEngaging);
        if (isEngaging && secondsVisible >= 1){
          startAdvancedTracking();
        }
      }
      return;
    }

    if (isVisible) {
      secondsVisible++;
      if (!reportedVisible) {
        reportedVisible = true;
        reportAdvancedAnalytics(1);
      }
    }

    if (isInteractive) {
      secondsInteractive++;
      if (useDebug) console.log("secondsInteractive: " + secondsInteractive);
      if (!reportedInteracted) {
        reportedInteracted = true;
        reportAdvancedAnalytics(2);
      }
    }

    hovered = secondsVisible > 0 && secondsInteractive == 0;
  }

  function adImpressions() {
    try {
      let allImpressionsRegistered = impressions501 && impressions502 && impressions503 && impressions1001 && impressions1003;

      if (!allImpressionsRegistered) {
        let now = Date.now();

        if (visibilityStartTimes[VISIBILITY_50] !== 0) {
          visibilityDurations[VISIBILITY_50] += now - visibilityStartTimes[VISIBILITY_50];
          visibilityStartTimes[VISIBILITY_50] = now;
        }
        if (visibilityStartTimes[VISIBILITY_100] !== 0) {
          visibilityDurations[VISIBILITY_100] += now - visibilityStartTimes[VISIBILITY_100];
          visibilityStartTimes[VISIBILITY_100] = now;
        }

        // Check impressions
        if (!impressions501) {
          impressions501 = impressionCheck(visibilityDurations[VISIBILITY_50], impressions501, 1000);
          if (impressions501) reportImpressionAnalytics(501);
        }
        if (!impressions502) {
          impressions502 = impressionCheck(visibilityDurations[VISIBILITY_50], impressions502, 2000);
          if (impressions502) reportImpressionAnalytics(502);
        }
        if (!impressions503) {
          impressions503 = impressionCheck(visibilityDurations[VISIBILITY_50], impressions503, 3000);
          if (impressions503) reportImpressionAnalytics(503);
        }
        if (!impressions1001) {
          impressions1001 = impressionCheck(visibilityDurations[VISIBILITY_100], impressions1001, 1000);
          if (impressions1001) reportImpressionAnalytics(1001);
        }
        if (!impressions1003) {
          impressions1003 = impressionCheck(visibilityDurations[VISIBILITY_100], impressions1003, 3000);
          if (impressions1003) reportImpressionAnalytics(1003);
        }
        // Log impressions
        if (useDebug) console.log(
          `Impressions: 501: ${impressions501} 502: ${impressions502} 503: ${impressions503} 1001: ${impressions1001} 1003: ${impressions1003}`
        );
      }
    } catch (e) {
      if (useDebug) console.log(e);
    }
  }

  var timeInterval = setInterval(updateTime, 1000);

  adContainer.addEventListener("mousedown", interacting, true);

  function interacting() {
    isInteractive = true;
    if (useDebug) console.log("interacting");
    if (!engagementReported) {
      startAdvancedTracking();
    }
  }

  if (isMobile) {
    adContainer.addEventListener(
      "click",
      function (e) {
        if (useDebug && isInteractive) console.log("inactive");
        isInteractive = false;
        if (useDebug && isEngaging && !engagementReported) console.log("not engaging");
        isEngaging = false;
      },
      false
    );

    adContainer.addEventListener(
      "touchend",
      function (e) {
        if (useDebug && isInteractive) console.log("inactive");
        if (useDebug) console.log(secondsInteractive);
        isInteractive = false;
        if (useDebug && isEngaging && !engagementReported) console.log("not engaging");
        isEngaging = false;
        secondsInteractive++;
      },
      false
    );
  } else {
    adContainer.addEventListener(
      "mouseleave",
      (e) => {
        if (useDebug) console.log("is interactive: " + isInteractive);
        if (useDebug && isInteractive) console.log("inactive");
        secondsInteractive++;
        isInteractive = false;
        if (useDebug && isEngaging && !engagementReported) console.log("not engaging");
        isEngaging = false;
      },
      false
    );
  }
  if (!isMobile) {
    adContainer.addEventListener(
      "mouseenter",
      function (e) {
        if (!engagementReported) {
          if (useDebug) console.log("engaging");
          isEngaging = true;
        }
      },
      false
    );
  }
  function startAdvancedTracking() {
    if (useDebug) {
      console.log("ad tracking started");
    }
    engagementReported = true;
    sendAnalyticsEvent("page-view", { page_title: startPage });
    sendAnalyticsEvent("ad-view", { impression: true });
    reportAdvancedAnalytics(0);
  }

  document.addEventListener("visibilitychange", function () {
    if (!engagementReported) return;

    if (document.visibilityState === "hidden") {
      clearInterval(timeInterval);
      intervalStarted = false;
      reportTimeAnalytics();
    } else if (!intervalStarted) timeInterval = setInterval(updateTime, 1000);
  });

  function reportAdvancedAnalytics(status) {
    if (!collectAnalytics) return;

    var data = {
      campaign_id: campaignID,
      campaign_tag: tag,
      language: language,
    };

    if (status == 0) {
      data["initial_load"] = true;
      data["page_view"] = pages[0];
    } else if (status == 1) {
      data["in_view"] = true;
      sendAnalyticsEvent("ad-view", { in_view: true });
    } else if (status == 2) {
      data["interacted"] = true;
      sendAnalyticsEvent("ad-view", { interacted: true });
    } else if (status == 3) {
      data["game_started"] = true;
    } else if (status == 4) {
      data["game_finished"] = true;
    } else return;

    $.ajax({
      url: url_base + "analytics",
      type: "post",
      contentType: "application/json",
      success: function (data) {
        if (useDebug) console.log(data);
      },
      error: function (response) {
        if (useDebug) console.log("There was an issue connecting to our server: " + response.responseText);
      },
      data: JSON.stringify(data),
    });
  }

  function reportImpressionAnalytics(status) {
    if (!collectAnalytics) return;

    var data = {
      campaign_id: campaignID,
      campaign_tag: tag,
      language: language,
    };

    if (status == 501) data["impressions_501"] = true;
    if (status == 502) data["impressions_502"] = true;
    if (status == 503) data["impressions_503"] = true;
    if (status == 1001) data["impressions_1001"] = true;
    if (status == 1003) data["impressions_1003"] = true;

    $.ajax({
      url: url_base + "report_impression",
      type: "post",
      contentType: "application/json",
      success: function (data) {
        if (useDebug) console.log(data);
      },
      error: function (response) {
        if (useDebug) console.log("There was an issue connecting to our server: " + response.responseText);
      },
      data: JSON.stringify(data),
    });
  }

  function reportTimeAnalytics() {
    if (!collectAnalytics || !engagementReported) return;
    if (navigator.sendBeacon && dwellTime - lastDwellTime > 0) {
      if (useDebug) console.log("reporting time analytics");

      var data = {
        campaign_id: campaignID,
        campaign_tag: tag,
        language: language,
        dwell_time: dwellTime - lastDwellTime,
        seconds_visible: secondsVisible - lastSecondsVisible,
        seconds_interactive: secondsInteractive - lastSecondsInteractive,
      };
      if (!reportHoveredDone) {
        if (!reportedHovered && hovered) {
          data["hovered"] = 1;
          reportedHovered = true;
          sendAnalyticsEvent("ad-view", { hovered: true });
        } else if (reportedHovered && !hovered) {
          data["hovered"] = -1;
          reportHoveredDone = true;
          sendAnalyticsEvent("ad-view", { hovered: false });
        }
      }

      //var blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      var blob = new Blob([JSON.stringify(data)], {
        type: "text/plain; charset=UTF-8",
      });
      navigator.sendBeacon(url_base + "analytics", blob);
      (lastSecondsVisible = secondsVisible), (lastSecondsInteractive = secondsInteractive), (lastDwellTime = dwellTime);

      sendAnalyticsEvent("ad-view", {
        dwell_time: data.dwell_time,
        seconds_visible: data.seconds_visible,
        seconds_interactive: data.seconds_interactive,
      });
    }
  }

  function reportPageViewAnalytics(page) {
    if (!collectAnalytics) return;

    var data = {
      campaign_id: campaignID,
      campaign_tag: tag,
      language: language,
      page_view: page,
    };

    $.ajax({
      url: url_base + "analytics",
      type: "post",
      contentType: "application/json; charset=utf-8",
      data: "json",
      dataType: "text json",
      success: function (data) {
        if (useDebug) console.log(data);
      },
      error: function (response) {
        if (useDebug) console.log("There was an issue connecting to our server: " + response.responseText);
      },
      data: JSON.stringify(data),
    });
  }

  this.pageView = (page, pageTitle) => {
    if (collectAnalytics) {
      sendAnalyticsEvent("page-view", { page_title: page });
      reportPageViewAnalytics(pageTitle);
    }
  };

  this.gameStarted = () => {
    if (collectAnalytics) {
      sendAnalyticsEvent("game_started", {});
      reportAdvancedAnalytics(3);
    }
  };

  this.gameEnded = () => {
    if (collectAnalytics) {
      sendAnalyticsEvent("game_finished", {});
      reportAdvancedAnalytics(4);
    }
  };
}
