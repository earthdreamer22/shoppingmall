import PropTypes from 'prop-types';

function AdminFormNotice({ status, statusType }) {
  if (!status) return null;
  return <div className={`status ${statusType === 'error' ? 'error' : ''}`}>{status}</div>;
}

AdminFormNotice.propTypes = {
  status: PropTypes.string,
  statusType: PropTypes.string,
};

export default AdminFormNotice;
