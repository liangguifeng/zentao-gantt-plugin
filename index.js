// ==UserScript==
// @name         禅道甘特图插件
// @icon         https://findcat.cn/favicon.ico
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  禅道使用Mermaid展示甘特图
// @author       liangguifeng
// @match        https://zentao0898o.hltmsp.com/zentao/my-task-assignedTo.html
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
        gantt: {
            axisFormatter: [
                // 定义日期格式化器
                ["%Y-%m-%d", function(d) {
                    return d.getDay() == 1; // 每一天都显示
                }]
            ]
        },
        themeVariables: {
            primaryColor: '#8a90dd', // 设置任务颜色
            lineColor: '#8a90dd', // 设置线条颜色
            textColor: '#333333', // 设置文本颜色
            taskTextColor: '#333333', // 确保任务文本颜色
            activeTaskBorderColor: '#8a90dd', // 确保活动任务边框颜色
            activeTaskTextColor: '#333333' // 确保活动任务文本颜色
        }
    });

    // 初次加载甘特图
    updateGanttChart();

    // 设置每10秒更新一次甘特图
    setInterval(updateGanttChart, 10000);

    function updateGanttChart() {
        var tasks = Array.from(document.querySelectorAll('#tasktable tbody tr'));

        // 初始化Mermaid文本
        var mermaidText = `
            gantt
                title 禅道甘特图
                dateFormat YYYY-MM-DD
                axisFormat %Y-%m-%d
        `;

        var taskDates = [];

        // 获取任务的相关信息
        var taskInfo = tasks.map(function(task) {
            var taskName = task.querySelector('td:nth-child(4) a').textContent.trim();
            var startDate = task.querySelector('td:nth-child(6)').textContent.trim();
            var endDate = task.querySelector('td:nth-child(7)').textContent.trim();

            if (!isValidDate(startDate) || !isValidDate(endDate)) {
                console.warn(`Invalid date for task: ${taskName}`);
                return null;
            }

            var startDateObj = new Date(startDate);
            var endDateObj = new Date(endDate);

            // 计算任务时长（结束日期 - 开始日期 + 1 天）
            var duration = (endDateObj - startDateObj) / (1000 * 60 * 60 * 24) + 1;

            if (duration < 1) {
                console.warn(`Invalid duration for task: ${taskName}`);
                return null;
            }

            taskDates.push(startDateObj);

            return {
                taskName: taskName,
                startDate: startDate,
                duration: duration
            };
        }).filter(task => task !== null);

        // 按开始日期排序任务
        taskInfo.sort(function(a, b) {
            return new Date(a.startDate) - new Date(b.startDate);
        });

        // 生成甘特图的任务部分
        taskInfo.forEach(function(task, index) {
            mermaidText += `
                section 任务${index + 1}
                ${task.taskName}(${task.duration}天) :active, ${task.startDate}, ${task.duration}d
            `;
        });

        // 确定横轴的日期范围
        var earliestDate = new Date(Math.min.apply(null, taskDates));
        earliestDate.setDate(earliestDate.getDate() - 1);

        var latestDate = new Date(earliestDate);
        latestDate.setDate(earliestDate.getDate() + 10);

        // 将开始日期和结束日期分别格式化
        var axisStartDate = formatDate(earliestDate);
        var axisEndDate = formatDate(latestDate);

        mermaidText += `
            section 日期
            时间线 :done, ${axisStartDate}, ${axisEndDate}
        `;

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

        // 初始化新的Mermaid容器
        mermaid.init(undefined, newMermaidContainer);
    }

    // 验证日期格式是否正确
    function isValidDate(dateString) {
        var regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateString.match(regex)) {
            return false;
        }
        var date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // 格式化日期为YYYY-MM-DD
    function formatDate(date) {
        var year = date.getFullYear();
        var month = ('0' + (date.getMonth() + 1)).slice(-2);
        var day = ('0' + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    }
})();
