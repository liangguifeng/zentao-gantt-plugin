// ==UserScript==
// @name         禅道甘特图插件
// @icon         https://findcat.cn/favicon.ico
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  禅道使用Mermaid展示甘特图
// @author       liangguifeng
// @match        <<你的禅道任务地址>>
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js
// ==/UserScript==

(function() {
    'use strict';

    // 创建底部内容区域元素
    var bottomContent = document.createElement('div');
    bottomContent.id = 'customBottomContent';
    document.body.appendChild(bottomContent);

    GM_addStyle(`
        #customBottomContent {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 33.33%;
            background-color: #FFFFFF;
            border-top: 1px solid #CCCCCC;
            z-index: 9999;
            overflow: auto;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            padding: 10px;
            box-sizing: border-box;
        }
        .mermaid {
            width: 100%;
            height: calc(100% - 20px);
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            overflow: auto;
        }
    `);

    mermaid.initialize({
        startOnLoad: true,
        theme: 'default', // 指定使用默认主题作为基础
        themeVariables: {
            // 自定义颜色
            primaryColor: '#8a90dd', // 设置任务颜色
            lineColor: '#8a90dd', // 设置线条颜色
            textColor: '#333333', // 如果需要，还可以设置文本颜色
        }
    });

    updateGanttChart();

    setInterval(updateGanttChart, 10000);

    function updateGanttChart() {
        var tasks = document.querySelectorAll('#tasktable tbody tr');

        var mermaidText = `
            gantt
            title 任务甘特图
            dateFormat YYYY-MM-DD
            axisFormat %m-%d
        `;

        tasks.forEach(function(task, index) {
            try {
                var taskName = task.querySelector('td:nth-child(4) a').textContent.trim();
                var startDate = task.querySelector('td:nth-child(6)').textContent.trim();
                var endDate = task.querySelector('td:nth-child(7)').textContent.trim();

                if (!isValidDate(startDate) || !isValidDate(endDate)) {
                    return;
                }

                mermaidText += `
                    section 任务${index + 1}
                    ${taskName} :active, ${startDate}, ${endDate}
                `;
            } catch (error) {
                console.error('Error processing task:', error);
            }
        });

        // 创建新的Mermaid容器
        var newMermaidContainer = document.createElement('div');
        newMermaidContainer.className = 'mermaid';
        newMermaidContainer.innerHTML = mermaidText;

        // 替换旧的Mermaid容器
        var oldMermaidContainer = document.querySelector('#customBottomContent .mermaid');
        if (oldMermaidContainer) {
            bottomContent.replaceChild(newMermaidContainer, oldMermaidContainer);
        } else {
            bottomContent.appendChild(newMermaidContainer);
        }

        // 对新的Mermaid容器初始化
        mermaid.init(undefined, newMermaidContainer);
    }

    function isValidDate(dateString) {
        var regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateString.match(regex)) {
            return false;
        }
        var date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
})();
