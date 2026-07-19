/**
 * Notifications Utility
 * 
 * Handles Expo push notifications for event reminders.
 * Schedules notifications for 9 AM day-of and 1 hour before event.
 * Uses AsyncStorage to persist reminder IDs.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REMINDERS_KEY = '@event_reminders';
const SCHOOL_REMINDERS_KEY = '@school_reminders';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface EventReminder {
  eventId: string;
  morningNotificationId: string;
  hourBeforeNotificationId: string;
}

interface SchoolReminder {
  announcementId: string;
  notificationId: string;
}

// Helper to parse time string (e.g., "7:30 PM" or "6:30 PM - 7:30 PM")
const parseTime = (timeString: string) => {
  const parts = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!parts) return { hours: 0, minutes: 0 };

  let hours = parseInt(parts[1], 10);
  const minutes = parseInt(parts[2], 10);
  const ampm = parts[3]?.toUpperCase();

  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  }
  if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return { hours, minutes };
};

// Helper to parse date string in local timezone
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Failed to get notification permissions!');
    return false;
  }

  return true;
}

export async function scheduleEventReminders(
  eventId: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string
): Promise<boolean> {
  const hasPermission = await registerForPushNotificationsAsync();
  if (!hasPermission) {
    return false;
  }

  const date = parseLocalDate(eventDate);
  const { hours, minutes } = parseTime(eventTime);

  // Schedule 9 AM reminder
  const morningDate = new Date(date);
  morningDate.setHours(9, 0, 0, 0);
  const secondsUntilMorning = Math.floor((morningDate.getTime() - Date.now()) / 1000);

  const morningNotificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📅 Event Today!',
      body: `Don't forget: ${eventTitle} is today at ${eventTime}`,
      data: { eventId, type: 'morning' },
      sound: true,
    },
    trigger: secondsUntilMorning > 0 ? { seconds: secondsUntilMorning, repeats: false } as Notifications.TimeIntervalTriggerInput : null,
  });

  // Schedule 1 hour before reminder
  const hourBeforeDate = new Date(date);
  hourBeforeDate.setHours(hours - 1, minutes, 0, 0);
  const secondsUntilHourBefore = Math.floor((hourBeforeDate.getTime() - Date.now()) / 1000);

  const hourBeforeNotificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Event Starting Soon!',
      body: `${eventTitle} starts in 1 hour`,
      data: { eventId, type: 'hourBefore' },
      sound: true,
    },
    trigger: secondsUntilHourBefore > 0 ? { seconds: secondsUntilHourBefore, repeats: false } as Notifications.TimeIntervalTriggerInput : null,
  });

  // Save reminder info to AsyncStorage
  const reminders = await getReminders();
  reminders[eventId] = {
    eventId,
    morningNotificationId,
    hourBeforeNotificationId,
  };
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  return true;
}

export async function cancelEventReminders(eventId: string) {
  const reminders = await getReminders();
  const reminder = reminders[eventId];

  if (reminder) {
    await Notifications.cancelScheduledNotificationAsync(reminder.morningNotificationId);
    await Notifications.cancelScheduledNotificationAsync(reminder.hourBeforeNotificationId);
    delete reminders[eventId];
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  }
}

export async function hasReminder(eventId: string): Promise<boolean> {
  const reminders = await getReminders();
  return !!reminders[eventId];
}

async function getReminders(): Promise<Record<string, EventReminder>> {
  const storedReminders = await AsyncStorage.getItem(REMINDERS_KEY);
  return storedReminders ? JSON.parse(storedReminders) : {};
}

// School Announcement Reminder Functions
export async function scheduleSchoolReminder(
  announcementId: string,
  announcementTitle: string,
  announcementDate: string,
  announcementTime?: string
): Promise<boolean> {
  const hasPermission = await registerForPushNotificationsAsync();
  if (!hasPermission) {
    return false;
  }

  const date = parseLocalDate(announcementDate);
  
  // If there's a specific time, remind 1 hour before
  // Otherwise, remind at 9 AM on the day
  let notificationDate: Date;
  let notificationBody: string;
  
  if (announcementTime) {
    const { hours, minutes } = parseTime(announcementTime);
    notificationDate = new Date(date);
    notificationDate.setHours(hours - 1, minutes, 0, 0);
    notificationBody = `${announcementTitle} starts in 1 hour at ${announcementTime}`;
  } else {
    notificationDate = new Date(date);
    notificationDate.setHours(9, 0, 0, 0);
    notificationBody = `Don't forget: ${announcementTitle} is today`;
  }

  const secondsUntilNotification = Math.floor((notificationDate.getTime() - Date.now()) / 1000);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏫 School Reminder',
      body: notificationBody,
      data: { announcementId, type: 'school' },
      sound: true,
    },
    trigger: secondsUntilNotification > 0 ? { seconds: secondsUntilNotification, repeats: false } as Notifications.TimeIntervalTriggerInput : null,
  });

  // Save reminder info to AsyncStorage
  const reminders = await getSchoolReminders();
  reminders[announcementId] = {
    announcementId,
    notificationId,
  };
  await AsyncStorage.setItem(SCHOOL_REMINDERS_KEY, JSON.stringify(reminders));
  return true;
}

export async function cancelSchoolReminder(announcementId: string) {
  const reminders = await getSchoolReminders();
  const reminder = reminders[announcementId];

  if (reminder) {
    await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    delete reminders[announcementId];
    await AsyncStorage.setItem(SCHOOL_REMINDERS_KEY, JSON.stringify(reminders));
  }
}

export async function hasSchoolReminder(announcementId: string): Promise<boolean> {
  const reminders = await getSchoolReminders();
  return !!reminders[announcementId];
}

async function getSchoolReminders(): Promise<Record<string, SchoolReminder>> {
  const storedReminders = await AsyncStorage.getItem(SCHOOL_REMINDERS_KEY);
  return storedReminders ? JSON.parse(storedReminders) : {};
}

