describe("app.views.Post", function(){

  describe("#render", function(){
    beforeEach(function(){
      window.current_user = app.user({name: "alice", avatar : {small : "http://avatar.com/photo.jpg"}});

      Diaspora.I18n.loadLocale({stream : {
        reshares : {
          one : "<%= count %> reshare",
          few : "<%= count %> reshares"
        }
      }})

      var posts = $.parseJSON(spec.readFixture("multi_stream_json"))["posts"];

      this.collection = new app.collections.Stream(posts);
      this.statusMessage = this.collection.models[0];
    })

    it("displays a reshare count", function(){
      this.statusMessage.set({reshares_count : 2})
      var view = new app.views.Post({model : this.statusMessage}).render();

      expect(view.$(".post_initial_info").html()).toContain(Diaspora.I18n.t('stream.reshares', {count: 2}))
    })

    it("does not display a reshare count for 'zero'", function(){
      this.statusMessage.set({reshares_count : 0})
      var view = new app.views.Post({model : this.statusMessage}).render();

      expect(view.$(".post_initial_info").html()).not.toContain("0 Reshares")
    })

    it("should markdownify the post's text", function(){
      this.statusMessage.set({text: "I have three Belly Buttons"})
      spyOn(window.markdown, "toHTML")
      new app.views.Post({model : this.statusMessage}).render();
      expect(window.markdown.toHTML).toHaveBeenCalledWith("I have three Belly Buttons")
    })

    context("changes hashtags to links", function(){
      it("links to a hashtag to the tag page", function(){
        this.statusMessage.set({text: "I love #parties"})
        var view = new app.views.Post({model : this.statusMessage}).render();
        expect(view.$("a:contains('#parties')").attr('href')).toBe('/tags/parties')
      })

      it("changes all hashtags", function(){
        this.statusMessage.set({text: "I love #parties and #rockstars and #unicorns"})
        var view = new app.views.Post({model : this.statusMessage}).render();
        expect(view.$("a.tag").length).toBe(3)
      })

      // NOTE THIS DIVERGES FROM GRUBER'S ORIGINAL DIALECT OF MARKDOWN.
      // We had to edit markdown.js line 291 - good people would have made a new dialect.
      //
      //    original : var m = block.match( /^(#{1,6})\s*(.*?)\s*#*\s*(?:\n|$)/ );
      //    \s* changed to \s+
      //
      it("doesn't create a header tag if the first word is a hashtag", function(){
        this.statusMessage.set({text: "#parties, I love"})
        var view = new app.views.Post({model : this.statusMessage}).render();
        expect(view.$("h1:contains(parties)")).not.toExist();
        expect(view.$("a:contains('#parties')")).toExist();

      })
    })

    context("user not signed in", function(){
      it("does not provide a Feedback view", function(){
        window.current_user = app.user(null);

        var view = new app.views.Post({model : this.statusMessage}).render();
        expect(view.feedbackView).toBeNull();
      })
    })

    context("NSFW", function(){
      it("contains a shield element", function(){
        this.statusMessage.set({text : "this is safe for work. #sfw"});

        var view = new app.views.Post({model : this.statusMessage}).render();
        var statusElement = $(view.el)

        expect(statusElement.find(".shield").html()).toBeNull();
      })

      it("does not contain a shield element", function(){
        this.statusMessage.set({text : "nudie magazine day! #nsfw"});

        var view = new app.views.Post({model : this.statusMessage}).render();
        var statusElement = $(view.el)

        expect(statusElement.find(".shield").html()).toNotBe(null);
      })
    })
  })
})
