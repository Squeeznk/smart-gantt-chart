import React, { useState } from "react";
import { GanttChart } from 'smart-webcomponents-react/ganttchart';
import { DropDownList, ListItem } from 'smart-webcomponents-react/dropdownlist';
import { Toast } from 'smart-webcomponents-react/toast';
import moment from 'moment';
import 'moment/locale/ru';
import 'smart-webcomponents-react/source/styles/smart.default.css';
import './App.css';
import jsondata from './data.json';
import jsondata1 from './data1.json';  
import Box from "./components/Box/Box";

const App = () => {

  moment.locale('en');

	const treeSize = '40%';
  const view = 'week';
	const durationUnit = 'day';
  const locale = 'en';
  const disableSelection = true;
  const disableTaskProgressChange = true;
  const showProgressLabel = false;
  const snapToNearest = false;

  function getDayInWeek (week,day,year) {
      var w=week||1,n=day||1,y=year||new Date().getFullYear(); //defaults
      var d=new Date(y,0,7*w);
      d.setDate(d.getDate()-(d.getDay()||7)+n);
      return d
  }
    
  const timelineHeaderFormatFunction = (date, type, isHeaderDetails, value) => {

    const ganttChart = document.querySelector('smart-gantt-chart');
    const isodt = date.toISOString();
    
    if (type === 'hour') {
      return '<div dtmom="' + moment(date).format('DD.MM.YYYY hh.mm.ss') + '">' + moment(date).format('LT') + '</div>';
    }

    if (type === 'day') {
      return '<div dtmom="' + moment(date).format('DD.MM.YYYY hh.mm.ss') + '">' + date.toLocaleDateString(ganttChart.locale, { weekday: 'short', day: 'numeric'}) + '</div>';

    }
    
    if (type === 'week') {  
      if(isHeaderDetails){
        return (
          moment(isodt).startOf('week').format('DD MMM - ') +
          moment(isodt).endOf('week').format('DD MMM')
        );
      }else{
        const weekstart = getDayInWeek(value,1,date.getFullYear());
        return (
          '<div dtmom="' + moment(date).format('DD.MM.YYYY hh.mm.ss') + '">' + 
          moment(weekstart).startOf('week').format('DD ' + 
          (moment(weekstart).startOf('week').month() !== moment(weekstart).endOf('week').month() ? 'MMM ' : '') + 
          '- ') +
          moment(weekstart).endOf('week').format('DD MMM') + 
          '</div>'
        )
      }
    }

    if (type === 'month') { 
        return (
          '<div dtmom="' + moment(date).format('DD.MM.YYYY hh.mm.ss') + '">' + moment(isodt).format('MMMM') + '</div>'
        );
    }

    return value;
  }

	const taskColumns = [
    {
      label: 'Номер',
      value: 'number',
      size: 200,
      columnMenu: true,
      formatFunction: function (value, item) {
          return '<div _item_id="'+item.id+'"></div>' + value;
      }  
    },
    {
      label: 'Задача',
      value: 'label',
      size: 250
    },
    {
      label: 'Начало',
      value: 'dateStart',
      size: 150,
      dateFormat: 'dd.MM.yyyy',
      formatFunction: function(value, item) {
        const pattern = /v-(task|epic|subtask)-not-planned/
        if( pattern.test(item.class)){
          return ''
        }else{
          return moment(item.dateStart).format('DD.MM.YYYY');
        }
      }
    },
    {
      label: 'Окончание',
      value: 'dateEnd',
      size: 100,
      dateFormat: 'dd.MM.yyyy',  
      formatFunction: function(value, item) {
        const pattern = /v-(task|epic|subtask)-not-planned/
        if( pattern.test(item.class)){
          return ''
        }else{
          return moment(item.dateEnd).format('DD.MM.YYYY');
        }
      }
    }
	];

  const [dataSource, setDataSource] = useState([]);
  const [dataSourceVariant, setDataSourceVariant] = useState(0);

  // Сэмпл на производительность

  // for (let i = 9; i < 1000 ; i++) {
  //   dataSource.push({
  //     "id":"id" + i,
  //     "label":"Задача 1."+i,
  //     "number":"ИП-0000000" + i,
  //     "type":"task",
  //     "level":1,
  //     "class":"v-task-not-planned"
  //   })
  // }


  const handleChange = (event) => {
    const ganttChart = document.querySelector('smart-gantt-chart');
		ganttChart.view = event.detail.value;
	}
  

  const handleClick = (event) => {

    // Если клик произошел в рабочем поле таймлайна, то начинаем магию
    if(event.target.className === 'smart-timeline-cell'){

      // Сопоставляем ячейку таймлайна, на которой кликнули с соответствующей ячейкой 
      // календаря в шапке для того, чтобы из ячейки календаря вытащить записанную 
      // в атрибут dtmom дату ячейки, где произошел клик
      // При сопоставлении опираемся на одинаковые style-атрибуты 'width' и 'left'

      let query = '.smart-timeline-view-cells > .smart-timeline-view-cell[style="width: '+event.target.style.width+'; left: '+event.target.style.left+';"]';

      let headerCell = document.querySelector(query); 
      if(headerCell === null){
        // исправляем косяк зарабов компоненты, которые меняют порядок атрибутов в style
        query = '.smart-timeline-view-cells > .smart-timeline-view-cell[style="left: '+event.target.style.left+'; width: '+event.target.style.width+';"]';
        headerCell = document.querySelector(query)
        if(headerCell === null){
          console.log('Элемент заголовка не найден')
          return
        }
      }

      // Получаем заранее записанную в аотрибут dtmom дату ячейки
      // Запись в атрибут мы делали при мутации вывода заголовков календаря

      // Здесь проверка, вдруг мы забыли добавить <div dtmom='DD.MM.YYYY'></div>
      if( headerCell.firstChild.firstChild.nodeType !== 1){
        console.log('В ячейках календаря не выставлен атрибут dtmom')
        return
      }

      const targetdate = headerCell.firstChild.firstChild.getAttribute('dtmom');

      const ganttChart = document.querySelector('smart-gantt-chart');

      // Получаем таску по path (https://www.htmlelements.com/docs/gantt-api/#toc-gettask)

      const clickedTask = ganttChart.getTask(
            event.target.parentElement.getAttribute('row-id')
          );

      // по установленному полу class определяем была ли задача 'not-planned'
      const pattern = /v-(task|epic|subtask)-not-planned/

      if( pattern.test(clickedTask.class) ){
        // если была 'not-planned', то устанавливаем нужные даынне в даты и апдейтим class
        const newdatestart = moment(targetdate, "DD.MM.YYYY hh.mm.ss").toISOString();
        ganttChart.beginUpdate()
        ganttChart.updateTask(clickedTask.id, { 
            "dateStart": newdatestart,  
            "dateEnd": moment(newdatestart).add(5,'days').toString(),
            "class": clickedTask.class.replace('-not-planned','')
        }); 
        ganttChart.endUpdate();
        ganttChart.refresh()
      }
    }
  }


  const handleConnEnd = (event) => {
    if(event.detail.type !== 1){
      
      const toast = document.querySelector('smart-toast');
      toast.value = "Этот тип связи не поддерживается"
      toast.open();

      const detail = event.detail;
      const ganttChart = document.querySelector('smart-gantt-chart');
      ganttChart.removeConnection(detail.startIndex, detail.endIndex, detail.type);
    } 
  }


  const handleReady = (event) => {
    const toast = document.querySelector('smart-toast');
    toast.value = "Загрузились"
    toast.type = "success";
    toast.open();

    setDataSourceVariant(1); // jsondata
    setDataSource(JSON.parse(JSON.stringify(jsondata)));

    const ganttChart = document.querySelector('smart-gantt-chart');
    ganttChart.scrollWidth = 100;
  }

  const handleReloadData = (event) => {
    let mockData = null;
    if(dataSourceVariant === 1){
      setDataSourceVariant(2); // jsondata1
      mockData = JSON.parse(JSON.stringify(jsondata1));
    } else {
      setDataSourceVariant(1); // jsondata
      mockData = JSON.parse(JSON.stringify(jsondata));
    }
    setDataSource(mockData.map((item) => ({ ...item })));
  }

  const scrollUp = (event) => {
    const ganttChart = document.querySelector('smart-gantt-chart');
    ganttChart.scrollTo(0,ganttChart.scrollLeft + 300);
  }

  const scrollDown = (event) => {
    const ganttChart = document.querySelector('smart-gantt-chart');
    ganttChart.scrollTo(0,ganttChart.scrollLeft - 300);
  }


	return (
		<div>
      <Box></Box>
      <button onClick={handleReloadData}>Reload dataSet</button>
      <div className="option">
          <h3>Детализация:</h3>
          <DropDownList onChange={handleChange}>
              <ListItem value="year">Год</ListItem>
              <ListItem value="month">Месяц</ListItem>
              <ListItem value="week" selected>Неделя</ListItem>
          </DropDownList>
      </div>
      <div style={{float: 'right', display: 'block', width: '100%'}}>
        <button style={{float: 'right'}} onClick={scrollUp}>&gt;</button>
        <button style={{float: 'right'}} onClick={scrollDown}>&lt;</button>
      </div>
      <Toast position="top-right" showCloseButton autoClose>Toast!</Toast>
      
			<GanttChart 
          onReady={handleReady}
          onClick={handleClick}
          onConnectionEnd={handleConnEnd}
          min="2023-01-01"
          dateStart="2023-02-25"
          dateEnd="2023-04-30"
          max="2024-01-01"
          dataSource={dataSource} 
          taskColumns={taskColumns} 
          treeSize={treeSize} 
          durationUnit={durationUnit}  
          locale={locale} 
          view={view} 
          
          columnResize={true}   
          
          disableSelection={disableSelection}
          disableTaskProgressChange={disableTaskProgressChange}
          showProgressLabel={showProgressLabel}

          snapToNearest={snapToNearest}

          timelineHeaderFormatFunction = {timelineHeaderFormatFunction}
          id="gantt">
      </GanttChart>
		</div>
	);
}

export default App;
