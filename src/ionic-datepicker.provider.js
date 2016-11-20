angular.module('ionic-datepicker.provider', [])

.provider('ionicDatePicker', function() {

  var config = {
    setLabel: 'Set',
    todayLabel: 'Today',
    closeLabel: 'Close',
    inputDate: new Date(),
    mondayFirst: true,
    weeksList: ["S", "M", "T", "W", "T", "F", "S"],
    monthsList: ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
    templateType: 'popup',
    showTodayButton: false,
    closeOnSelect: false,
    disableWeekdays: []
  };

  this.configDatePicker = function(inputObj) {
    angular.extend(config, inputObj);
  };

  this.$get = ['$rootScope', '$ionicPopup', '$ionicModal', 'IonicDatepickerService', function($rootScope, $ionicPopup, $ionicModal, IonicDatepickerService) {

    var provider = {};

    var $scope = $rootScope.$new();
    $scope.today = resetHMSM(new Date()).getTime();
    $scope.disabledDates = [];
    $scope.data = {};

    $scope.paidDates = {
      dates: [],
      index: {}
    };
    $scope.unpaidDates = {
      dates: [],
      index: {}
    };

    //Reset the hours, minutes, seconds and milli seconds
    function resetHMSM(currentDate) {
      currentDate.setHours(0);
      currentDate.setMinutes(0);
      currentDate.setSeconds(0);
      currentDate.setMilliseconds(0);
      return currentDate;
    }

    //Previous month
    $scope.prevMonth = function() {
      if ($scope.currentDate.getMonth() === 1) {
        $scope.currentDate.setFullYear($scope.currentDate.getFullYear());
      }
      $scope.currentDate.setMonth($scope.currentDate.getMonth() - 1);
      $scope.data.currentMonth = $scope.mainObj.monthsList[$scope.currentDate.getMonth()];
      $scope.data.currentYear = $scope.currentDate.getFullYear();
      refreshDateList($scope.currentDate);
    };

    //Next month
    $scope.nextMonth = function() {
      if ($scope.currentDate.getMonth() === 11) {
        $scope.currentDate.setFullYear($scope.currentDate.getFullYear());
      }
      $scope.currentDate.setDate(1);
      $scope.currentDate.setMonth($scope.currentDate.getMonth() + 1);
      $scope.data.currentMonth = $scope.mainObj.monthsList[$scope.currentDate.getMonth()];
      $scope.data.currentYear = $scope.currentDate.getFullYear();
      refreshDateList($scope.currentDate);
    };

    function getReservationByDate(date) {
      var pr = $scope.paidDates.index[date];
      var ur = $scope.unpaidDates.index[date];
      if (pr) return pr;
      if (ur) return ur;
      return;
    }

    //Date selected
    $scope.dateSelected = function(selectedDate) {
      var reservationId = getReservationByDate(selectedDate.epoch);
      if (!selectedDate || Object.keys(selectedDate).length === 0) return;
      $scope.selctedDateEpoch = selectedDate.epoch;

      if ($scope.mainObj.closeOnSelect) {
        $scope.mainObj.callback($scope.selctedDateEpoch, reservationId);
        if ($scope.mainObj.templateType.toLowerCase() == 'popup') {
          $scope.popup.close();
        } else {
          closeModal();
        }
      }
    };

    //Set today as date for the modal
    $scope.setIonicDatePickerTodayDate = function() {
      var today = new Date();
      refreshDateList(new Date());
      $scope.selctedDateEpoch = resetHMSM(today).getTime();
      if ($scope.mainObj.closeOnSelect) {
        $scope.mainObj.callback($scope.selctedDateEpoch);
        closeModal();
      }
    };

    //Set date for the modal
    $scope.setIonicDatePickerDate = function() {
      $scope.mainObj.callback($scope.selctedDateEpoch);
      closeModal();
    };

    //Setting the disabled dates list.
    function setDisabledDates(mainObj) {
      if (!mainObj.disabledDates || mainObj.disabledDates.length === 0) {
        $scope.disabledDates = [];
      } else {
        $scope.disabledDates = [];
        angular.forEach(mainObj.disabledDates, function(val, key) {
          val = resetHMSM(new Date(val));
          $scope.disabledDates.push(val.getTime());
        });
      }
    }

    function getReservationDateRange(reservation) {
      var start = new Date(reservation.start_date_of_booking);
      var end = new Date(reservation.end_date_of_booking);
      var dateRange = moment.range(start, end);
      var dateRangeArray = dateRange.toArray('days');
      var temp = [];
      angular.forEach(dateRangeArray, function(date, key) {
        var val = resetHMSM(new Date(date)).getTime();
        temp.push(val);
      });
      return temp;
    }

    function resetReservationDates() {
      $scope.paidDates = {
        dates: [],
        index: {}
      };
      $scope.unpaidDates = {
        dates: [],
        index: {}
      };
    }

    //Setting the disabled dates list.
    function setReservationDates(mainObj) {
      resetReservationDates();

      if (mainObj.reservations && mainObj.reservations.length) {
        angular.forEach(mainObj.reservations, function(reservation, key) {
          var dateRangeArray = getReservationDateRange(reservation);

          if (reservation.pid) {
            angular.forEach(dateRangeArray, function(date, key) {
              if (!_.includes($scope.paidDates.dates, date)) {
                $scope.paidDates.dates.push(date);
              }
              if (!$scope.paidDates.index[date]) {
                $scope.paidDates.index[date] = reservation.id;
              }
            });
          } else {
            angular.forEach(dateRangeArray, function(date, key) {
              if (!_.includes($scope.unpaidDates.dates, date)) {
                $scope.unpaidDates.dates.push(date);
              }
              if (!$scope.unpaidDates.index[date]) {
                $scope.unpaidDates.index[date] = reservation.id;
              }
            });
          }
        });
      }
    }

    //Refresh the list of the dates of a month
    function refreshDateList(currentDate) {
      currentDate = resetHMSM(currentDate);
      $scope.currentDate = angular.copy(currentDate);

      var firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDate();
      var lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

      $scope.monthsList = [];
      if ($scope.mainObj.monthsList && $scope.mainObj.monthsList.length === 12) {
        $scope.monthsList = $scope.mainObj.monthsList;
      } else {
        $scope.monthsList = IonicDatepickerService.monthsList;
      }

      $scope.yearsList = IonicDatepickerService.getYearsList($scope.mainObj.from, $scope.mainObj.to);

      $scope.dayList = [];

      var tempDate, disabled, paid, unpaid;
      $scope.firstDayEpoch = resetHMSM(new Date(currentDate.getFullYear(), currentDate.getMonth(), firstDay)).getTime();
      $scope.lastDayEpoch = resetHMSM(new Date(currentDate.getFullYear(), currentDate.getMonth(), lastDay)).getTime();

      for (var i = firstDay; i <= lastDay; i++) {
        tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        disabled = (tempDate.getTime() < $scope.fromDate) || (tempDate.getTime() > $scope.toDate) || $scope.mainObj.disableWeekdays.indexOf(tempDate.getDay()) >= 0;

        if (disabled) {
          paid = unpaid = false;
        } else {
          var t = resetHMSM(tempDate).getTime();

          paid = _.includes($scope.paidDates.dates, t);
          unpaid = _.includes($scope.unpaidDates.dates, t);
        }


        $scope.dayList.push({
          date: tempDate.getDate(),
          month: tempDate.getMonth(),
          year: tempDate.getFullYear(),
          day: tempDate.getDay(),
          epoch: tempDate.getTime(),
          disabled: disabled,
          paid: paid,
          unpaid: unpaid
        });
      }

      //To set Monday as the first day of the week.
      var firstDayMonday = $scope.dayList[0].day - $scope.mainObj.mondayFirst;
      firstDayMonday = (firstDayMonday < 0) ? 6 : firstDayMonday;

      for (var j = 0; j < firstDayMonday; j++) {
        $scope.dayList.unshift({});
      }

      $scope.rows = [0, 7, 14, 21, 28, 35];
      $scope.cols = [0, 1, 2, 3, 4, 5, 6];

      $scope.data.currentMonth = $scope.mainObj.monthsList[currentDate.getMonth()];
      $scope.data.currentYear = currentDate.getFullYear();
      $scope.data.currentMonthSelected = angular.copy($scope.data.currentMonth);
      $scope.currentYearSelected = angular.copy($scope.data.currentYear);
      $scope.numColumns = 7;
    }

    //Month changed
    $scope.monthChanged = function(month) {
      var monthNumber = $scope.monthsList.indexOf(month);
      $scope.currentDate.setMonth(monthNumber);
      refreshDateList($scope.currentDate);
    };

    //Year changed
    $scope.yearChanged = function(year) {
      $scope.currentDate.setFullYear(year);
      refreshDateList($scope.currentDate);
    };

    //Setting up the initial object
    function setInitialObj(ipObj) {
      $scope.mainObj = angular.copy(ipObj);
      $scope.selctedDateEpoch = resetHMSM($scope.mainObj.inputDate).getTime();

      if ($scope.mainObj.weeksList && $scope.mainObj.weeksList.length === 7) {
        $scope.weeksList = $scope.mainObj.weeksList;
      } else {
        $scope.weeksList = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      }
      if ($scope.mainObj.mondayFirst) {
        $scope.weeksList.push($scope.mainObj.weeksList.shift());
      }
      $scope.disableWeekdays = $scope.mainObj.disableWeekdays;

      setDisabledDates($scope.mainObj);
      setReservationDates($scope.mainObj);
      refreshDateList($scope.mainObj.inputDate);
    }

    $ionicModal.fromTemplateUrl('ionic-datepicker-modal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });

    function openModal() {
      $scope.modal.show();
    }

    function closeModal() {
      $scope.modal.hide();
    }

    $scope.closeIonicDatePickerModal = function() {
      closeModal();
    };

    //Open datepicker popup
    provider.openDatePicker = function(ipObj) {
      var buttons = [];
      delete $scope.fromDate;
      delete $scope.toDate;

      $scope.mainObj = angular.extend({}, config, ipObj);
      if ($scope.mainObj.from) {
        $scope.fromDate = resetHMSM(new Date($scope.mainObj.from)).getTime();
      }
      if ($scope.mainObj.to) {
        $scope.toDate = resetHMSM(new Date($scope.mainObj.to)).getTime();
      }

      if (ipObj.disableWeekdays && config.disableWeekdays) {
        $scope.mainObj.disableWeekdays = ipObj.disableWeekdays.concat(config.disableWeekdays);
      }
      setInitialObj($scope.mainObj);

      if (!$scope.mainObj.closeOnSelect) {
        buttons = [{
          text: $scope.mainObj.setLabel,
          type: 'button_set',
          onTap: function(e) {
            $scope.mainObj.callback($scope.selctedDateEpoch);
          }
        }];
      }

      if ($scope.mainObj.showTodayButton) {
        buttons.push({
          text: $scope.mainObj.todayLabel,
          type: 'button_today',
          onTap: function(e) {
            var today = new Date();
            refreshDateList(new Date());
            $scope.selctedDateEpoch = resetHMSM(today).getTime();
            if (!$scope.mainObj.closeOnSelect) {
              e.preventDefault();
            }
          }
        });
      }

      buttons.push({
        text: $scope.mainObj.closeLabel,
        type: 'button_close',
        onTap: function(e) {
          console.log('ionic-datepicker popup closed.');
        }
      });

      if ($scope.mainObj.templateType.toLowerCase() == 'popup') {
        $scope.popup = $ionicPopup.show({
          templateUrl: 'ionic-datepicker-popup.html',
          scope: $scope,
          cssClass: 'ionic_datepicker_popup',
          buttons: buttons
        });
      } else {
        openModal();
      }
    };

    return provider;

  }];

});
