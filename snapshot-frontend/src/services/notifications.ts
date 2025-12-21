import * as Notifications from "expo-notifications";
import { EventSubscription } from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const NotificationsService = {
  requestPermissions: async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Notification permissions not granted.");
      return false;
    }
    return true;
  },

  scheduleHourlyTriggers: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📸 Time to Snapshot!",
        body: "The 10-minute window is open. Capture your moment now.",
        sound: true,
        data: { screen: "Home" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        minute: 0,
        repeats: true,
      },
    });

    console.log("🔔 Hourly notifications are scheduled.");
  },

  setupResponseListener: (
    onResponse: (response: Notifications.NotificationResponse) => void
  ): EventSubscription => {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification Tapped:", response.notification.request.content.data);
      onResponse(response);
    });
  },

  testTrigger: async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test",
        body: "it's working",
        data: { screen: "Home" },
      },
      trigger: null,
    })
  }
};