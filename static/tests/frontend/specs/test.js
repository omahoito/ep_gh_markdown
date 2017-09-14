describe("Convert from markdown", function(){
    //create a new pad before each test run
    beforeEach(function(cb){
      helper.newPad(cb);
      this.timeout(60000);
    });
	
	function clearText (chrome$, inner$) {
		var $editorContainer = chrome$("#editorcontainer");
		var $editorContents = inner$("div")
		$editorContents.sendkeys('{selectall}');
		$editorContents.sendkeys('{backspace}');
	}

	it("Converts headings", function (done) {
		this.timeout(60000);
		var chrome$ = helper.padChrome$;
		var inner$ = helper.padInner$;
		var $firstElement = inner$("div").first();

		// Clears default text.
		clearText(chrome$, inner$);

		$firstElement.sendkeys('# Heading 1{enter}');
		$firstElement.sendkeys('## Heading 2{enter}');
		$firstElement.sendkeys('##### Heading 3{enter}');
		$firstElement.sendkeys('#Incorrect{enter}');
		$firstElement.sendkeys('#    H1{enter}');
		$firstElement.sendkeys('Alt-H1{enter}');
		$firstElement.sendkeys('======{enter}');

		// Wait until all text is written and click convert md button
		helper.waitFor(function () {
			var $last = inner$('div:not(".primary-none")').last();
			return $last.text() == '======';
		}).done(function () {
			var $mdBtn = chrome$(".ep_gh_markdown");
			$mdBtn.click();
			// User needs to press ok, cancel fails the test..
			helper.waitFor(function () {
				return chrome$('.ep_gh_markdown').hasClass("clicked");
			}).done(function () {
				helper.waitFor(function () {
					var $firstHeading = inner$('div:not(".primary-none")').first();
					var hasHeading = $firstHeading.find("h1").length;
					return hasHeading == 1;
				}).done(function () {
					// We have already checked first heading, check the rest.
					var $h2 = inner$("div:eq(2)");
					var $h5 = inner$("div:eq(4)");
					var $incorrect = inner$("div:eq(6)");
					var $multiplespaces = inner$("div:eq(7)");
					var $alth1 = inner$("div:eq(9)");
					expect($h2.find("h2").length).to.be(1);
					expect($h5.find("h5").length).to.be(1);
					expect($incorrect.find("h1").length).to.be(0);
					expect($multiplespaces.find("h1").length).to.be(1);
					expect($alth1.find("h1").length).to.be(0); // Alts are not functioning properly
					done();
				});
			});
		});
	});

	it("Converts emphasis", function (done) {
		this.timeout(60000);
		var chrome$ = helper.padChrome$;
		var inner$ = helper.padInner$;
		var $firstElement = inner$("div").first();

		// Clears default text.
		clearText(chrome$, inner$);

		$firstElement.sendkeys('*italics*{enter}');
		$firstElement.sendkeys('_italics_{enter}');
		$firstElement.sendkeys('**bold**{enter}');
		$firstElement.sendkeys('__bold__{enter}');
		$firstElement.sendkeys('**combined bold and _italic_**{enter}');
		$firstElement.sendkeys('~~strikethrough~~{enter}');
		$firstElement.sendkeys('Normal, **bold**');

		// Wait until all text is written and click convert md button
		helper.waitFor(function () {
			var $last = inner$('div:not(".primary-none")').last();
			return $last.text() == 'Normal, **bold**';
		}).done(function () {
			var $mdBtn = chrome$(".ep_gh_markdown");
			$mdBtn.click();

			// User needs to press ok, cancel fails the test..
			helper.waitFor(function () {
				return chrome$('.ep_gh_markdown').hasClass("clicked");
			}).done(function () {
				// Need to wait until ep is done with conversion
				helper.waitFor(function () {
					var $italics = inner$('div').first();
					var isItalics = $italics.find("i").length;
					return isItalics == 1;
				}).done(function () {
					var $i2 = inner$("div").first().next();
					var $b = $i2.next();
					var $b2 = $b.next();
					var $combined = $b2.next();
					var $s = $combined.next();
					var $inline = $s.next();
					expect($i2.find("i").length).to.be(1);
					expect($b.find("b").length).to.be(1);
					expect($combined.find("b").length).to.be(2);
					expect($combined.find("i").length).to.be(1);
					expect($s.find("s").length).to.be(1);
					expect($inline.find("b").length).to.be(1);
					expect($inline.text()).to.be("Normal, bold");
					done();
				});
			});
		});
	});

	it("Converts links", function (done) {
		this.timeout(60000);
		var chrome$ = helper.padChrome$;
		var inner$ = helper.padInner$;
		var $firstElement = inner$("div").first();

		// Clears default text.
		clearText(chrome$, inner$);
		
		$firstElement.sendkeys('[url](https://google.com)');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('Inline [link](https://www.google.com "Googles Homepage") with title.');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('<https://www.google.com>');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('[reference link][ref text]');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('[ref text]: https://www.google.com');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('https://www.google.com');

		// User needs to press ok, cancel fails the test..
		helper.waitFor(function () {
			var $last = inner$('div:not(".primary-none")').last();
			return $last.text() == 'https://www.google.com';
		}).done(function () {
			var $mdBtn = chrome$(".ep_gh_markdown");
			$mdBtn.click();
			helper.waitFor(function () {
				return chrome$('.ep_gh_markdown').hasClass("clicked");
			}).done(function () {
				// Need to wait until ep is done with conversion
				helper.waitFor(function () {
					var $first = inner$('div').first();
					var isLink = $first.find("a").length;
					return isLink == 1;
				}).done(function () {
					var $first = inner$('div').first().find("a");
					var $inline = inner$("div").first().next();
					var $bracket = $inline.next();
					var $ref = $bracket.next();
					var $regular = inner$('div:not(".primary-none")').last();
					expect($first.attr("href") === "https://google.com" && $first.text() === "url").to.be(true);
					expect($inline.find("a").attr("href") === "https://www.google.com" && $inline.text() === "Inline link with title.").to.be(true);
					expect($bracket.find("a").attr("href") === "https://www.google.com" && $bracket.text() === "https://www.google.com").to.be(true);
					expect($ref.find("a").attr("href") === "https://www.google.com" && $ref.text() === "reference link").to.be(true);
					expect($regular.find("a").attr("href") === "https://www.google.com" && $regular.text() === "https://www.google.com").to.be(false);
					done();
				});
			});
		});
	});

	it("Converts lists", function (done) {
		this.timeout(60000);
		var chrome$ = helper.padChrome$;
		var inner$ = helper.padInner$;
		var $firstElement = inner$("div").first();

		// Clears default text.
		clearText(chrome$, inner$);
		
		$firstElement.sendkeys('1. First');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('  1. OL Sub');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('3. Third');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('  * UL Sub');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('* Asterisk');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('- Minus');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('+ Plus');

		// User needs to press ok, cancel fails the test..
		helper.waitFor(function () { // Wait until all text is written
			var $last = inner$('div:not(".primary-none")').last();
			return $last.text() == '+ Plus';
		}).done(function () {
			var $mdBtn = chrome$(".ep_gh_markdown");
			$mdBtn.click();
			helper.waitFor(function () {
				return chrome$('.ep_gh_markdown').hasClass("clicked");
			}).done(function () {
				// Need to wait until ep is done with conversion
				helper.waitFor(function () {
					var $last = inner$('div:not(".primary-none")').last();
					var isList = $last.find("ul").length;
					return isList == 1;
				}).done(function () {
					var $first = inner$('div').first();
					var $olsub = $first.next();
					var $third = $olsub.next();
					var $ulsub = $third.next();
					var $empty = $ulsub.next();
					var $asterisk = $empty.next();
					var $minus = $asterisk.next();
					var $plus = $minus.next();

					expect($first.find("ol").hasClass("list-number1") && $first.text() === "First ").to.be(true);
					expect($olsub.find("ol").hasClass("list-number2") && $olsub.text() === "OL Sub").to.be(true);
					expect($third.find("ol").hasClass("list-number1") && $third.text() === "Third ").to.be(true);
					expect($ulsub.find("ul").hasClass("list-bullet2") && $ulsub.text() === "UL Sub ").to.be(false);
					expect($empty.hasClass("primary-none")).to.be(true);
					expect($asterisk.find("ul").hasClass("list-bullet1") && $asterisk.text() === "Asterisk ").to.be(false);
					expect($minus.find("ul").hasClass("list-bullet1") && $minus.text() === "Minus ").to.be(false);
					expect($plus.find("ul").hasClass("list-bullet1") && $plus.text() === "Plus ").to.be(false);
					done();
				});
			});
		});
	});

	it("Converts images", function (done) {
		this.timeout(60000);
		var chrome$ = helper.padChrome$;
		var inner$ = helper.padInner$;
		var $firstElement = inner$("div").first();
		var imgSrc = 'https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png'
		// Clears default text.
		clearText(chrome$, inner$);
		
		$firstElement.sendkeys(`![alt text](${imgSrc} "Logo Title Text 1")`);
		$firstElement.sendkeys('{enter}{enter}');
		$firstElement.sendkeys('![alt text][logo]');
		$firstElement.sendkeys('{enter}{enter}');
		$firstElement.sendkeys(`[logo]: ${imgSrc} "Logo Title Text 2"`);

		// User needs to press ok, cancel fails the test..
		helper.waitFor(function () { // Wait until all text is written
			var $last = inner$('div:not(".primary-none")').last();
			return $last.text() == `[logo]: ${imgSrc} "Logo Title Text 2"`;
		}).done(function () {
			var $mdBtn = chrome$(".ep_gh_markdown");
			$mdBtn.click();
			helper.waitFor(function () {
				return chrome$('.ep_gh_markdown').hasClass("clicked");
			}).done(function () {
				// Need to wait until ep is done with conversion
				helper.waitFor(function () {
					var $last = inner$('div:not(".primary-none")').last();
					var isConverted = $last.text() === '*'; // Etherpad adds wierd asterisk after image, no idea how to counter this.
					return isConverted
				}).done(function () {
					var $first = inner$('div').first();
					var $empty = inner$('div:eq(2)');
					var $second = $empty.next();
					expect($first.find("img").length).to.be(1);
					expect($first.find("img").attr("src") === imgSrc).to.be(true);
					expect($empty.hasClass("primary-none")).to.be(true);
					expect($second.find("img").length).to.be(1);
					expect($second.find("img").attr("src") === imgSrc).to.be(true);
					done();
				});
			});
		});
	});

	it("Converts codeblocks", function (done) {
		this.timeout(60000);
		var chrome$ = helper.padChrome$;
		var inner$ = helper.padInner$;
		var $firstElement = inner$("div").first();

		// Clears default text.
		clearText(chrome$, inner$);
		
		$firstElement.sendkeys('Inline `code` block');
		$firstElement.sendkeys('{enter}{enter}');
		$firstElement.sendkeys('```');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('var s = true');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('alert(s)');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('```');
		$firstElement.sendkeys('{enter}{enter}');

		// User needs to press ok, cancel fails the test..
		helper.waitFor(function () { // Wait until all text is written
			var $last = inner$('div:not(".primary-none")').last();
			return $last.text() == "```";
		}).done(function () {
			var $mdBtn = chrome$(".ep_gh_markdown");
			$mdBtn.click();
			helper.waitFor(function () {
				return chrome$('.ep_gh_markdown').hasClass("clicked");
			}).done(function () {
				// Need to wait until ep is done with conversion
				helper.waitFor(function () {
					var $last = inner$('div:not(".primary-none")').last();
					var isConverted = $last.find("code").length === 2;
					return isConverted
				}).done(function () {
					var $inline = inner$('div').first();
					var $codeblock1 = inner$('div:eq(2)');
					var $codeblock2 = $codeblock1.next();

					expect($inline.find("code").length).to.be(1);
					expect($inline.text() === 'Inline code block').to.be(true);
					expect($codeblock1.find("code").length).to.be(2);
					expect($codeblock1.text() === 'var s = true').to.be(true);
					expect($codeblock2.find("code").length).to.be(2);
					expect($codeblock2.text() === 'alert(s)').to.be(true);
					done();
				});
			});
		});
	});

	it("Converts quotes", function (done) {
		this.timeout(60000);
		var chrome$ = helper.padChrome$;
		var inner$ = helper.padInner$;
		var $firstElement = inner$("div").first();

		// Clears default text.
		clearText(chrome$, inner$);
		
		$firstElement.sendkeys('> Blockquote');
		$firstElement.sendkeys('{enter}{enter}');
		$firstElement.sendkeys('> Many');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('> Lines');
		$firstElement.sendkeys('{enter}');
		$firstElement.sendkeys('> - Should not be list');
		$firstElement.sendkeys('{enter}');

		// User needs to press ok, cancel fails the test..
		helper.waitFor(function () { // Wait until all text is written
			var $last = inner$('div:not(".primary-none")').last();
			return $last.text() == "> - Should not be list";
		}).done(function () {
			var $mdBtn = chrome$(".ep_gh_markdown");
			$mdBtn.click();
			helper.waitFor(function () {
				return chrome$('.ep_gh_markdown').hasClass("clicked");
			}).done(function () {
				// Need to wait until ep is done with conversion
				helper.waitFor(function () {
					var $last = inner$('div:not(".primary-none")').last();
					var isConverted = $last.find("blockquote").length === 1;
					return isConverted;
				}).done(function () {
					var $first = inner$('div').first();
					var $quote1 = inner$('div:eq(2)');
					var $quote2 = $quote1.next();
					var $quote3 = $quote2.next();
					expect($first.find("blockquote").length).to.be(1);
					expect($first.text() === 'Blockquote ').to.be(true);
					expect($quote1.find("blockquote").length).to.be(1);
					expect($quote1.text() === 'Many ').to.be(true);
					expect($quote2.find("blockquote").length).to.be(1);
					expect($quote2.text() === 'Lines ').to.be(true);
					expect($quote3.find("blockquote").length).to.be(1);
					expect($quote3.text() === '– Should not be list ').to.be(true);
					expect($quote3.find("ul").length).to.be(0);
					done();
				});
			});
		});
	});

  });
  