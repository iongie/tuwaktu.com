import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AvatarUploadPickerComponent } from './avatar-upload-picker.component';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('AvatarUploadPickerComponent', () => {
  let component: AvatarUploadPickerComponent;
  let fixture: ComponentFixture<AvatarUploadPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarUploadPickerComponent],
      providers: [
        WorkerDashboardApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarUploadPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus berhasil dibuat', () => {
    expect(component).toBeTruthy();
  });

  it('harus menampilkan inisial pekerja jika belum ada URL avatar', () => {
    fixture.componentRef.setInput('workerName', 'Budi Santoso');
    fixture.detectChanges();
    expect(component.initials()).toBe('BS');
  });

  it('harus membersihkan avatar saat tombol removeAvatar ditekan', () => {
    let emittedUrl = 'initial';
    component.avatarUrlChange.subscribe((url) => {
      emittedUrl = url;
    });

    component.removeAvatar();
    expect(emittedUrl).toBe('');
    expect(component.localPreviewUrl()).toBeNull();
  });
});

