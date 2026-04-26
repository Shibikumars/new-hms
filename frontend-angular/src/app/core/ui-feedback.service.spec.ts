import { TestBed } from '@angular/core/testing';
import { UiFeedbackService, UiFeedbackMessage } from './ui-feedback.service';

describe('UiFeedbackService', () => {
  let service: UiFeedbackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiFeedbackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('info() should publish info message', (done) => {
    service.messages$.subscribe((msg: UiFeedbackMessage) => {
      expect(msg.message).toBe('Test info');
      expect(msg.kind).toBe('info');
      done();
    });
    service.info('Test info');
  });

  it('warn() should publish warn message', (done) => {
    service.messages$.subscribe((msg: UiFeedbackMessage) => {
      expect(msg.message).toBe('Test warning');
      expect(msg.kind).toBe('warn');
      done();
    });
    service.warn('Test warning');
  });

  it('error() should publish error message', (done) => {
    service.messages$.subscribe((msg: UiFeedbackMessage) => {
      expect(msg.message).toBe('Test error');
      expect(msg.kind).toBe('error');
      done();
    });
    service.error('Test error');
  });

  it('should trim whitespace from message', (done) => {
    service.messages$.subscribe((msg: UiFeedbackMessage) => {
      expect(msg.message).toBe('trimmed');
      done();
    });
    service.info('  trimmed  ');
  });

  it('should not publish empty message', (done) => {
    let published = false;
    service.messages$.subscribe(() => {
      published = true;
    });
    service.info('');
    service.info('   ');
    setTimeout(() => {
      expect(published).toBeFalse();
      done();
    }, 50);
  });

  it('should publish multiple messages', (done) => {
    const messages: UiFeedbackMessage[] = [];
    service.messages$.subscribe(msg => messages.push(msg));
    
    service.info('First');
    service.warn('Second');
    service.error('Third');
    
    setTimeout(() => {
      expect(messages.length).toBe(3);
      expect(messages[0].kind).toBe('info');
      expect(messages[1].kind).toBe('warn');
      expect(messages[2].kind).toBe('error');
      done();
    }, 50);
  });
});
