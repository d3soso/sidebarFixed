/* =============================

    $.sidebarfixed
    ===============

    sidebarなどのブロック要素を
    スクロールに合わせて位置をFIXします。

    http://usosake.net/
    2016/11/28 v0.1
    2016/12/14 v0.2


    ********************

        args (options)

    ********************

    scrollContainer :jqueryObject (Optional)
    --default -> $(window)
        スクロールする要素が$(window)以外の場合にターゲットを指定します

    defaultMarginTop:Number (Optional)
    --default -> 0
        上辺で固定されている時、画面上との空きをpxで設定します

    fixedTarget :jqueryObject (Optional)
    --default -> $(this).parent()
        下スクロール時、スクロールする要素の固定を停止する基準になるボトムを持つHTMLObjectを指定

    minWidth :Number (Optional)
    --defalut -> -1
        sidebarfixedが動作する最小のscrollContainer.width（指定値以下のwidthの時はposition:static;に設定される)

    maxWidth :Number (Optional)
    --defalut -> -1
        sidebarfixedが動作する最大のwscrollContainer.Width（指定値以下のwidthの時はposition:static;に設定される)


============================== */

(function($) {

    var __count = 0;

    $.fn.sidebarfixed = function(args) {

        args = (!args) ? {} : args;

        var _this = this;
        var _ary = [];
        var _args = {
            minWidth : (!args.minWidth) ? -1 : args.minWidth,
            maxWidth : (!args.maxWidth) ? -1 : args.maxWidth,
			scrollContainer   : (!args.scrollContainer) ? $(window) : args.scrollContainer,
			defaultMarginTop : (!args.defaultMarginTop) ? 0 : args.defaultMarginTop
        };

        $(document).ready(
            function() {
                _this.each(INIT);
                _args.scrollContainer.scroll(SCROLL);
                $(window).resize(RESIZE);
            }
        );

        function INIT() {

            if($(this).parent().css("position")==="static") $(this).parent().css("position", "relative");

            var decoy = addDecoy($(this));
            $(this).addClass("sidebarFixed");

            $(this).css("position", "absolute");
            $(this).css("top", decoy.offset().top - $(this).parent().offset().top);
            setPositionLeft($(this), decoy);

            var offset = $(this).offset();
            var last_st = offset.top;
            var obj = {
                target : this,
                decoy : decoy,
                // active : この要素$(this)に対してfixedが機能しているときはtrue minWidthなどで範囲外になった時にfalse
                active : true,
                flag : {
                    top : false,
                    bottom : false
                },
                topPosition : 0,
                // $(this)がoverflow:scroll内の要素だった場合 $(this).offset().topでは
                // _args.scrollContainer内でのoffse().topが取れないので
                // _args.scrollContainerの中でのoffset().topの値を計算で求めて格納しておく
                virtualOffsetTop : 0,
                default_offset : $(this).offset(),
                default_top : decoy.offset().top - $(this).parent().offset().top,
                fixed_target : (!args.fixedTarget) ? $(this).parent() : args.fixedTarget,
                last_scrollTop : 0 // 前のターンのscrollTopを格納
            }

            console.log(_args);

            _ary.push(obj);

            __count++;

        }

        function RESIZE() {

            for(var i=0; i<_ary.length; i++) {

                $(_ary[i].decoy).width( $(_ary[i].target).width() );
                $(_ary[i].decoy).height( $(_ary[i].target).height() );
                setPositionLeft($(_ary[i].target), $(_ary[i].decoy));

                if(_args.maxWidth < _args.scrollContainer.width() && _args.maxWidth >= 0) _ary[i].active = false;
                else if(_args.minWidth > _args.scrollContainer.width() && _args.minWidth >= 0) _ary[i].active = false;
                else _ary[i].active = true;

                branchiScrollAction(_ary[i]);

            }
        }

        function SCROLL() {
            for(var i=0; i<_ary.length; i++) branchiScrollAction(_ary[i]);
        }

        function branchiScrollAction(obj) {
            if(obj.active) {
                if($(obj.decoy).css("display")=="none") $(obj.decoy).css("display", "block");
                ACTION(obj);
            }else {
                $(obj.decoy).css("display", "none");
                $(obj.target).css({
                    position : "static",
                    top:0
                })
            }
        }

        function setPositionLeft(obj, decoy) {

            if(obj.css("position")==="absolute") {
                obj.css("left", decoy.offset().left - obj.parent().offset().left);
            }else if(obj.css("position")==="fixed") {
                obj.css("left", decoy.offset().left);
            }

        }

        function addDecoy(obj) {

            // 対象の要素のleft座標の基準とするために
            // その要素の代わりにダミーのブロック要素を設置する

            var id = 'sidebarFixed-decoy-' + __count;
            var tagName = obj.prop("tagName");
            obj.before('<' + tagName + ' id="' + id + '" class="sidebarFixed-decoy"></' + tagName + '>');
            var decoy = $("#" + id);

            // CSS
            decoy.width(obj.width());
            decoy.height(obj.height());

            if(obj.css("position")!=="static") decoy.css("position", obj.css("position"));
            if(obj.css("left")!=="auto") decoy.css("left", obj.css("left"));
            if(obj.css("right")!=="auto") decoy.css("right", obj.css("right"));

            if(obj.css("float")!=="none") decoy.css("float", obj.css("float"));

            return decoy;

        }


        function ACTION(obj) {

            var scrollTop = _args.scrollContainer.scrollTop();


            if(scrollTop >= getBottomY(obj) - $(window).height()) {
                // scrollTopがscrollContainerの下辺より下になった時

                obj.flag.top = obj.flag.bottom = false;
                obj.topPosition = $(obj.fixed_target).height() - $(obj.target).height();
                $(obj.target).css({
                    position : "absolute",
                    top : obj.topPosition
                })

                setPositionLeft($(obj.target), $(obj.decoy));

            }else if(scrollTop < obj.default_offset.top) {
                // スクロール量がdecoy.offset.topより上になった時

                obj.flag.top = obj.flag.bottom = false;
                obj.topPosition = obj.default_top;
                $(obj.target).css({
                    position : "absolute",
                    top : obj.topPosition
                })

                setPositionLeft($(obj.target), $(obj.decoy));
                obj.virtualOffsetTop = obj.topPosition + obj.default_offset.top;

            }else if(scrollTop > obj.last_scrollTop) {
                // scrollContainerの範囲内で下にスクロールしている時

                if(obj.flag.top) {
                    obj.flag.top = false;
                    obj.topPosition = (obj.virtualOffsetTop > 0) ?  obj.virtualOffsetTop - obj.default_offset.top : 0;
                    $(obj.target).css({
                        position : "absolute",
                        top : obj.topPosition
                    })

                    setPositionLeft($(obj.target), $(obj.decoy));
                    obj.virtualOffsetTop = obj.topPosition + obj.default_offset.top;

                // }else if(!obj.flag.bottom && scrollTop > $(obj.target).outerHeight() + $(obj.target).offset().top - $(window).height() && $(obj.target).height() + obj.default_offset.top < _args.scrollContainer.height()) {
                }else if(!obj.flag.bottom && scrollTop > $(obj.target).outerHeight() + obj.virtualOffsetTop - $(window).height() - _args.defaultMarginTop) {

                    obj.flag.bottom = true;
                    $(obj.target).css({
                        position : "fixed",
                        top : $(window).height() - $(obj.target).outerHeight()
                    })

                    setPositionLeft($(obj.target), $(obj.decoy));

                }

            }else if(scrollTop < obj.last_scrollTop && scrollTop > obj.default_offset.top) {
                // scrollContainerの範囲内で上にスクロールしている時

                if(obj.flag.bottom) {

                    obj.flag.bottom = false;
                    obj.topPosition = (obj.virtualOffsetTop > 0) ? obj.virtualOffsetTop : 0;
                    $(obj.target).css({
                        position : "absolute",
                        top : obj.topPosition - _args.defaultMarginTop
                    })

                    setPositionLeft($(obj.target), $(obj.decoy));
                    obj.virtualOffsetTop = obj.topPosition + obj.default_offset.top;

                }else if(!obj.flag.top && scrollTop < obj.virtualOffsetTop - _args.defaultMarginTop) {

                    obj.flag.top = true;
                    $(obj.target).css({
                        position : "fixed",
                        top : _args.defaultMarginTop
                    })

                    setPositionLeft($(obj.target), $(obj.decoy));

                }

            }else {

                obj.flag.top = obj.flag.bottom = false;
                obj.topPosition = (obj.virtualOffsetTop > 0) ? obj.virtualOffsetTop - obj.default_offset.top : 0;
                $(obj.target).css({
                    position : "absolute",
                    top : obj.topPosition
                })

                setPositionLeft($(obj.target), $(obj.decoy));
                obj.virtualOffsetTop = obj.topPosition + obj.default_offset.top;

            }

            // position:fixedの時はスクロールごとにvirtualOffsetTopが変わる
            if( $(obj.target).css("position")=="fixed" ) {
                obj.virtualOffsetTop = scrollTop + parseInt($(obj.target).css("top"));
            }

            obj.last_scrollTop = scrollTop;

        }


        // スクロール固定が停止するボトムラインの位置を取得
        function getBottomY(obj) {
            return obj.fixed_target.offset().top + obj.fixed_target.height()
        }

    }

})(jQuery);
