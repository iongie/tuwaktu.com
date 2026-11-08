import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRatingInputComponent } from './star-rating-input.component';

describe('StarRatingInputComponent', () => {
  let component: StarRatingInputComponent;
  let fixture: ComponentFixture<StarRatingInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance StarRatingInputComponent dengan benar', () => {
    expect(component).toBeTruthy();
    expect(component.rating()).toBe(0);
  });

  it('harus memperbarui rating saat selectRating dipanggil', () => {
    component.selectRating(4);
    expect(component.rating()).toBe(4);
    expect(component.displayedRating()).toBe(4);
    expect(component.isFilled(4)).toBe(true);
    expect(component.isFilled(5)).toBe(false);
  });

  it('harus memperbarui hoveredRating saat mouse enter dan reset saat mouse leave', () => {
    component.onMouseEnter(5);
    expect(component.hoveredRating()).toBe(5);
    expect(component.displayedRating()).toBe(5);

    component.onMouseLeave();
    expect(component.hoveredRating()).toBe(0);
    expect(component.displayedRating()).toBe(0);
  });
});

