# MMD Study Planner

برنامه‌ریز درسی فارسی متصل به Supabase و منتشرشونده روی GitHub Pages.

## امکانات نسخه اولیه
- ورود با شماره موبایل و رمز عبور
- داشبورد روزانه و آمار وظایف
- ثبت، تکمیل و حذف وظایف و تکالیف
- برنامه ثابت هفتگی
- گزارش پیشرفت
- تنظیمات نام نمایشی، خواب، ساعت بیداری و پوسته
- پنل مدیر برای ایجاد حساب و اشتراک کاربران
- استقرار خودکار با GitHub Actions

## اتصال Supabase
پروژه: `tbmxbtbayqgfvdlmeuaz`
آدرس: `https://tbmxbtbayqgfvdlmeuaz.supabase.co`

کلید publishable داخل `app.js` برای استفاده عمومی قرار دارد. کلید `service_role` را هرگز در فایل‌های مرورگر قرار ندهید.

## مراحل تکمیل راه‌اندازی
1. در Supabase بخش Authentication → Providers، ورود با Phone را فعال و ارائه‌دهنده پیامک را تنظیم کنید.
2. در Authentication → URL Configuration آدرس GitHub Pages را به Redirect URLs اضافه کنید.
3. Edge Function با نام `admin-manage` را منتشر کنید و secrets سمت سرور `SUPABASE_URL`، `SUPABASE_ANON_KEY` و `SUPABASE_SERVICE_ROLE_KEY` را تنظیم کنید.
4. حساب اولیه را بسازید و از محیط امن SQL مقدار `profiles.is_admin` را فقط برای حساب مدیر مورداعتماد به true تغییر دهید.
5. در GitHub Settings → Pages گزینه Build and deployment را روی GitHub Actions بگذارید.

این نسخه پایه اولیه است؛ پیش از استفاده واقعی باید احراز هویت شماره تلفن، سیاست‌های RLS و تابع مدیریت مدیر آزمایش شوند. ثبت‌نام عمومی غیرفعال است و حساب‌ها توسط مدیر ایجاد می‌شوند.

## انتشار
نسخه 2.0.6 در شاخه main منتشر شده و استقرار سایت از طریق GitHub Actions انجام می‌شود.
