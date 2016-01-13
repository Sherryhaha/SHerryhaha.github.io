
/*
Tipue Search 4.0
Copyright (c) 2014 Tipue
Tipue Search is released under the MIT License
http://www.tipue.com/search
*/


(function($) {

     $.fn.tipuesearch = function(options) {

          var set = $.extend( {

               'show'                   : 7,
               'newWindow'              : false,
               'showURL'                : true,
               'minimumLength'          : 3,
               'descriptiveWords'       : 25,
               'highlightTerms'         : true,
               'highlightEveryTerm'     : false,
               'mode'                   : 'static',
               'liveDescription'        : '*',
               'liveContent'            : '*',
               'contentLocation'        : 'tipuesearch/tipuesearch_content.json'

          }, options);

          return this.each(function() {

               var tipuesearch_in = {
                    pages: [] //存放搜索到的结果文章
               };
               $.ajaxSetup({
                    async: false
               });

               if (set.mode == 'live')
               {
                    for (var i = 0; i < tipuesearch_pages.length; i++)
                    {
                         $.get(tipuesearch_pages[i], '',
                              function (html)
                              {
                                   var cont = $(set.liveContent, html).text();
                                   cont = cont.replace(/\s+/g, ' ');
                                   var desc = $(set.liveDescription, html).text();
                                   desc = desc.replace(/\s+/g, ' ');

                                   var t_1 = html.toLowerCase().indexOf('<title>');
                                   var t_2 = html.toLowerCase().indexOf('</title>', t_1 + 7);
                                   if (t_1 != -1 && t_2 != -1)
                                   {
                                        var tit = html.slice(t_1 + 7, t_2);
                                   }
                                   else
                                   {
                                        var tit = 'No title';
                                   }

                                   tipuesearch_in.pages.push({
                                        "title": tit,
                                        "text": desc,
                                        "tags": cont,
                                        "loc": tipuesearch_pages[i]
                                   });
                              }
                         );
                    }
               }

               if (set.mode == 'json')
               {
                    $.getJSON(set.contentLocation,
                         function(json)
                         {
                              tipuesearch_in = $.extend({}, json);
                         }
                    );
               }

               if (set.mode == 'static')
               {
                    tipuesearch_in = $.extend({}, tipuesearch); //{pages:[]}
               }

               var tipue_search_w = '';
               if (set.newWindow)
               {
                    tipue_search_w = ' target="_blank"';
               }

               function getURLP(name)
               {
                    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20')) || null;
               }
               if (getURLP('q'))
               {
                    $('#tipue_search_input').val(getURLP('q'));
                    getTipueSearch(0, true);
               }

               $(this).keyup(function(event)
               {
                    if(event.keyCode == '13')
                    {
                         getTipueSearch(0, true);
                    }
               });

               function getTipueSearch(start, replace)
               {
                    $('#tipue_search_content').hide();
                    var out = '';
                    var results = '';
                    var show_replace = false;
                    var show_stop = false;
                    var standard = true;
                    var c = 0;
                    found = new Array();

                    var d = $('#tipue_search_input').val().toLowerCase();
                    d = $.trim(d);
                    //对字符串预处理
                    if ((d.match("^\"") && d.match("\"$")) || (d.match("^'") && d.match("'$")))
                    {
                         standard = false;
                    }//标准字符串的判断

                    if (standard) //把原搜索字符串经过特殊符号修正删除之后,再进行断句处理,去除掉when,where,and之类的连词,声称
                    {
                         var d_w = d.split(' '); //pat,d_w是个数组
                         d = '';
                         for (var i = 0; i < d_w.length; i++)//i是d_w数组下标,f是tipuesearch_stop_words下标
                         {
                              var a_w = true;
                              for (var f = 0; f < tipuesearch_stop_words.length; f++)
                              {
                                   if (d_w[i] == tipuesearch_stop_words[f])
                                   {
                                        a_w = false;
                                        show_stop = true; //如果存在连词,show-stop为true
                                   }
                              }
                              if (a_w)//a_w为false表示连词
                              {
                                   d = d + ' ' + d_w[i];//把获取的非连词加到d
                              }
                         }
                         d = $.trim(d);//去掉两端空格
                         d_w = d.split(' '); //d_w是去掉连词之后的数组,d是去掉连词之后的字符串
                    }
                    else
                    {
                         d = d.substring(1, d.length - 1);
                    }



                    if (d.length >= set.minimumLength)
                    {
                         if (standard)
                         {
                              if (replace)//错词纠正
                              {
                                   var d_r = d;
                                   for (var i = 0; i < d_w.length; i++)
                                   {
                                        for (var f = 0; f < tipuesearch_replace.words.length; f++)
                                        {
                                             if (d_w[i] == tipuesearch_replace.words[f].word)
                                             {
                                                  d = d.replace(d_w[i], tipuesearch_replace.words[f].replace_with);
                                                  show_replace = true;
                                             }
                                        }
                                   }
                                   d_w = d.split(' '); //d是没有错词的字符串,词组之间用空格分隔,d_w是没有错词的字符串数组
                              }

                              var d_t = d;
                              for (var i = 0; i < d_w.length; i++) //d_w中词组的关联
                              {
                                   for (var f = 0; f < tipuesearch_stem.words.length; f++)
                                   {
                                        if (d_w[i] == tipuesearch_stem.words[f].word)
                                        {
                                             d_t = d_t + ' ' + tipuesearch_stem.words[f].stem;
                                        }
                                   }
                              } //d_t返回的是原本的d加上关联的词组中相关的词组
                              d_w = d_t.split(' ');
                              console.log(tipuesearch_in);
                              for (var i = 0; i < tipuesearch_in.pages.length; i++)
                              {
                                   var score = 1000000000; //搜索结果匹配度的一个标量值,该值越大,搜索结果越接近,反之与搜索词相关度越小.
                                   var s_t = tipuesearch_in.pages[i].text; //搜到的文章的文本内容
                                   for (var f = 0; f < d_w.length; f++)
                                   {
                                        var pat = new RegExp(d_w[f], 'i');
                                        if (tipuesearch_in.pages[i].title.search(pat) != -1)
                                        {
                                             score -= (200000 - i);
                                        }
                                        if (tipuesearch_in.pages[i].text.search(pat) != -1)
                                        {
                                             score -= (150000 - i);
                                        }

                                        if (set.highlightTerms)
                                        {
                                             if (set.highlightEveryTerm)
                                             {
                                                  var patr = new RegExp('(' + d_w[f] + ')', 'gi');
                                             }
                                             else
                                             {
                                                  var patr = new RegExp('(' + d_w[f] + ')', 'i');
                                             }
                                             s_t = s_t.replace(patr, "<span class=\"h01\">$1</span>");//把匹配到的词高亮
                                        }
                                        if (tipuesearch_in.pages[i].tags.search(pat) != -1)
                                        {
                                             score -= (100000 - i);
                                        }

                                        if (d_w[f].match("^-"))
                                        {
                                             pat = new RegExp(d_w[f].substring(1), 'i');
                                             if (tipuesearch_in.pages[i].title.search(pat) != -1 || tipuesearch_in.pages[i].text.search(pat) != -1 || tipuesearch_in.pages[i].tags.search(pat) != -1)
                                             {
                                                  score = 1000000000;
                                             }
                                        }
                                   }

                                   if (score < 1000000000)
                                   {
                                        //console.log(tipuesearch_in.pages[i].loc);此处代码针对bootstrap3主题不适用,从终端打印结果来看,pages元素是不含loc属性的,而应该替换为url属性
                                        found[c++] = score + '^' + tipuesearch_in.pages[i].title + '^' + s_t + '^' + tipuesearch_in.pages[i].url;
                                   }
                              }
                         }
                         else
                         {
                              for (var i = 0; i < tipuesearch_in.pages.length; i++)
                              {
                                   var score = 1000000000;
                                   var s_t = tipuesearch_in.pages[i].text;
                                   var pat = new RegExp(d, 'i');
                                   if (tipuesearch_in.pages[i].title.search(pat) != -1)
                                   {
                                        score -= (200000 - i);
                                   }
                                   if (tipuesearch_in.pages[i].text.search(pat) != -1)
                                   {
                                        score -= (150000 - i);
                                   }

                                   if (set.highlightTerms)
                                   {
                                        if (set.highlightEveryTerm)
                                        {
                                             var patr = new RegExp('(' + d + ')', 'gi');
                                        }
                                        else
                                        {
                                             var patr = new RegExp('(' + d + ')', 'i');
                                        }
                                        s_t = s_t.replace(patr, "<span class=\"h01\">$1</span>");
                                   }
                                   if (tipuesearch_in.pages[i].tags.search(pat) != -1)
                                   {
                                        score -= (100000 - i);
                                   }

                                   if (score < 1000000000)
                                   {

                                        found[c++] = score + '^' + tipuesearch_in.pages[i].title + '^' + s_t + '^' + tipuesearch_in.pages[i].url;
                                   }
                              }
                         }

                         if (c != 0) //搜到了结果
                         {
                              if (show_replace == 1) //说明有纠正
                              {
                                   out += '<div id="tipue_search_warning_head">Showing results for ' + d + '</div>';
                                   out += '<div id="tipue_search_warning">Search instead for <a href="javascript:void(0)" id="tipue_search_replaced">' + d_r + '</a></div>';
                              }
                              if (c == 1) //只搜到了一个结果
                              {
                                   out += '<div id="tipue_search_results_count">1 result</div>';
                              }
                              else
                              {
                                   c_c = c.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                   out += '<div id="tipue_search_results_count">' + c_c + ' results</div>';
                              }

                              found.sort(); //按score排序, 因为score在found元素字符串的第一位
                              var l_o = 0;
                              for (var i = 0; i < found.length; i++)
                              {
                                   var fo = found[i].split('^'); //把found元素按^分隔,分别是[搜索匹配度标量值,标题,文章内容,loc(应该是文章链接url)]
                                   if (l_o >= start && l_o < set.show + start)
                                   {
                                        out += '<div class="tipue_search_content_title"><a href="' + fo[3] + '"' + tipue_search_w + '>' +  fo[1] + '</a></div>';

                                        if (set.showURL)
                                        {
                                             out += '<div class="tipue_search_content_url"><a href="' +fo[3] + '"' + tipue_search_w + '>' + fo[3] + '</a></div>';
                                        }

                                        var t = fo[2];
                                        var t_d = '';
                                        var t_w = t.split(' ');
                                        if (t_w.length < set.descriptiveWords)
                                        {
                                             t_d = t;
                                        }
                                        else
                                        {
                                             for (var f = 0; f < set.descriptiveWords; f++)
                                             {
                                                  t_d += t_w[f] + ' ';
                                             }
                                        }
                                        t_d = $.trim(t_d);
                                        if (t_d.charAt(t_d.length - 1) != '.')
                                        {
                                             t_d += ' ...';
                                        }
                                        out += '<div class="tipue_search_content_text">' + t_d + '</div>';
                                   }
                                   l_o++;
                              }

                              if (c > set.show)
                              {
                                   var pages = Math.ceil(c / set.show);
                                   var page = (start / set.show);
                                   out += '<div id="tipue_search_foot"><ul id="tipue_search_foot_boxes">';

                                   if (start > 0)
                                   {
                                       out += '<li><a href="javascript:void(0)" class="tipue_search_foot_box" id="' + (start - set.show) + '_' + replace + '">Prev</a></li>';
                                   }

                                   if (page <= 2)
                                   {
                                        var p_b = pages;
                                        if (pages > 3)
                                        {
                                             p_b = 3;
                                        }
                                        for (var f = 0; f < p_b; f++)
                                        {
                                             if (f == page)
                                             {
                                                  out += '<li class="current">' + (f + 1) + '</li>';
                                             }
                                             else
                                             {
                                                  out += '<li><a href="javascript:void(0)" class="tipue_search_foot_box" id="' + (f * set.show) + '_' + replace + '">' + (f + 1) + '</a></li>';
                                             }
                                        }
                                   }
                                   else
                                   {
                                        var p_b = page + 2;
                                        if (p_b > pages)
                                        {
                                             p_b = pages;
                                        }
                                        for (var f = page - 1; f < p_b; f++)
                                        {
                                             if (f == page)
                                             {
                                                  out += '<li class="current">' + (f + 1) + '</li>';
                                             }
                                             else
                                             {
                                                  out += '<li><a href="javascript:void(0)" class="tipue_search_foot_box" id="' + (f * set.show) + '_' + replace + '">' + (f + 1) + '</a></li>';
                                             }
                                        }
                                   }

                                   if (page + 1 != pages)
                                   {
                                       out += '<li><a href="javascript:void(0)" class="tipue_search_foot_box" id="' + (start + set.show) + '_' + replace + '">Next</a></li>';
                                   }

                                   out += '</ul></div>';
                              }
                         }
                         else
                         {
                              out += '<div id="tipue_search_warning_head">Nothing found</div>';
                         }
                    }
                    else //如果没有连词且词长度小于最小的设定,就返回提示
                    {
                         if (show_stop)
                         {
                              out += '<div id="tipue_search_warning_head">Nothing found</div><div id="tipue_search_warning">Common words are largely ignored</div>';
                         }
                         else
                         {
                              out += '<div id="tipue_search_warning_head">Search too short</div>';
                              if (set.minimumLength == 1)
                              {
                                   out += '<div id="tipue_search_warning">Should be one character or more</div>';
                              }
                              else
                              {
                                   out += '<div id="tipue_search_warning">Should be ' + set.minimumLength + ' characters or more</div>';
                              }
                         }
                    }

                    $('#tipue_search_content').html(out);
                    $('#tipue_search_content').slideDown(200);

                    $('#tipue_search_replaced').click(function()
                    {
                         getTipueSearch(0, false);
                    });

                    $('.tipue_search_foot_box').click(function()
                    {
                         var id_v = $(this).attr('id');
                         var id_a = id_v.split('_');

                         getTipueSearch(parseInt(id_a[0]), id_a[1]);
                    });
               }

          });
     };

})(jQuery);
