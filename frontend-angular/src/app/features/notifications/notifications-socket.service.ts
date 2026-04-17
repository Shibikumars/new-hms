import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { NotificationItem } from './notifications-api.service';
import { AuthService } from '../../core/auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationsSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;

  constructor(private authService: AuthService) {}

  connect(
    _userId: number,
    onMessage: (item: NotificationItem) => void,
    onConnect?: () => void,
    onDisconnect?: () => void
  ): void {
    this.disconnect();

    const token = this.authService.getToken();

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiBaseUrl}/ws`),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {}
    });

    this.client.onConnect = () => {
      this.subscription = this.client?.subscribe(`/user/queue/notifications`, (message: IMessage) => {
        try {
          const payload = JSON.parse(message.body) as NotificationItem;
          onMessage(payload);
        } catch {
          // Ignore malformed payloads from stream.
        }
      }) ?? null;
      onConnect?.();
    };

    this.client.onWebSocketClose = () => {
      onDisconnect?.();
    };

    this.client.onStompError = () => {
      onDisconnect?.();
    };

    this.client.activate();
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}
