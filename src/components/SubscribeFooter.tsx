import { Bell } from "lucide-react";
import { NotificationButton } from "./NotificationButton";
export function SubscribeFooter() {
  return (
    <div className="subscribe-footer">
      <p className="subscribe-footer-title">
        <Bell size={16} /> Keep up with new blogs, stories & projects
      </p>
      <NotificationButton />
    </div>
  );
}
