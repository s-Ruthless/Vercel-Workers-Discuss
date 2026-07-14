import { ref, watch } from 'vue';

const currentSiteId = ref(localStorage.getItem('vwd_admin_site_id') || 'default');

watch(currentSiteId, (val) => {
  if (val) {
    localStorage.setItem('vwd_admin_site_id', val);
  } else {
    localStorage.removeItem('vwd_admin_site_id');
  }
});

export function useSite() {
  return { currentSiteId };
}
