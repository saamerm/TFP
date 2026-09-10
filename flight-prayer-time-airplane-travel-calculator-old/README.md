# Flight Prayer Time Airplane Travel Calculator

## Introduction

Contains the code that can be used to [calculate prayer times during airplane travel flights](https://thefirstprototype.com/flight-prayer-time-airplane-travel-calculator/)

## Notes

- The problem is challenging because the prayer time changes as the time/distance also changes!
- Currently this tool loops through each minute of the flight and checking when the time and prayer time at the location match (or when time is safely higher by 1 minute)
- For prayer times, dont use values that are lower than the flight time, or higher than the arrival time.
- Dev Note: The code is open-source, so feel free to contribute with design or logic by submitting a Pull Request to the code. To increase accuracy to the second, you just have to reduce the step counter of the for-loop
